param(
  [string]$FolderPath = ".\FECHAMENTO EM XML",
  [switch]$DryRun
)

$ErrorActionPreference = "Stop"

$SupabaseUrl = "https://khevuaohphrwhjasmbsy.supabase.co"
$SupabaseAnonKey = "sb_publishable_dof_x7F6Xt7zzLB-N0uf9Q_hm4STzvR"
$NotesTable = "loss_notes"
$ItemsTable = "loss_items"
$NotesChunkSize = 25
$ItemsChunkSize = 80

function Write-Info($message) {
  Write-Host "[info] $message" -ForegroundColor Cyan
}

function Write-Success($message) {
  Write-Host "[ok] $message" -ForegroundColor Green
}

function Normalize-Text([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return "" }
  return $value.Trim()
}

function Get-NodeText($parent, [string]$tagName) {
  if ($null -eq $parent) { return "" }
  $node = $parent.SelectSingleNode(".//*[local-name()='$tagName']")
  if ($null -eq $node) { return "" }
  return (Normalize-Text $node.InnerText)
}

function Get-AccessKey([xml]$xmlDoc) {
  $explicit = Get-NodeText $xmlDoc "chNFe"
  if ($explicit) { return ($explicit -replace "\D", "") }

  $infNFe = $xmlDoc.SelectSingleNode("//*[local-name()='infNFe']")
  if ($null -eq $infNFe) { return "" }
  $infId = Normalize-Text $infNFe.GetAttribute("Id")
  if (-not $infId) { return "" }
  return (($infId -replace "^NFe", "") -replace "\D", "")
}

function Get-MonthKey([string]$dateText) {
  if ([string]::IsNullOrWhiteSpace($dateText)) { return "Sem data" }
  try {
    $date = [datetimeoffset]::Parse($dateText)
    return ("{0}/{1}" -f $date.ToString("MMM", [System.Globalization.CultureInfo]::GetCultureInfo("pt-BR")).ToLower().TrimEnd("."), $date.Year)
  } catch {
    return "Sem data"
  }
}

function Get-CompetenceKey([string]$dateText) {
  if ([string]::IsNullOrWhiteSpace($dateText)) { return "Sem data" }
  try {
    $date = [datetimeoffset]::Parse($dateText).AddMonths(-1)
    return ("{0}/{1}" -f $date.ToString("MMM", [System.Globalization.CultureInfo]::GetCultureInfo("pt-BR")).ToLower().TrimEnd("."), $date.Year)
  } catch {
    return "Sem data"
  }
}

function Get-SafeStore([string]$name) {
  if ([string]::IsNullOrWhiteSpace($name)) { return "Loja nao identificada" }
  return (($name -replace "(?i)SUPERMERCADO\s*", "").Trim())
}

function Get-ClassifiedType([string]$operation) {
  $normalized = (Normalize-Text $operation).ToUpperInvariant()
  if ($normalized.Contains("USO") -or $normalized.Contains("CONSUMO")) { return "Uso/Consumo" }
  if ($normalized.Contains("SAIDA") -or $normalized.Contains("SAIDA")) { return "Saida entre lojas" }
  if ($normalized.Contains("PERDA")) { return "Perdas" }
  return "Outros"
}

function Get-DetailType([string]$type, [string]$sector) {
  if ($type -eq "Uso/Consumo" -and $sector -and $sector -ne "Nao classificado") {
    return "Uso/Consumo $sector"
  }
  return $type
}

function Get-ClassifiedSector([string]$operation, [string]$product) {
  $text = ("{0} {1}" -f (Normalize-Text $operation), (Normalize-Text $product)).ToUpperInvariant()
  if ($text.Contains("ACOUGUE")) { return "Acougue" }
  if ($text.Contains("FLV")) { return "FLV" }
  if ($text.Contains("PRODUCAO PADARIA")) { return "Producao Padaria" }
  if ($text.Contains("PADARIA")) { return "Padaria" }
  if ($text.Contains("BEBIDAS")) { return "Bebidas" }
  if ($text.Contains("FURTO")) { return "Furto" }
  if ($text.Contains("PAGAS")) { return "Perdas Pagas" }
  if ($text.Contains("SAIDA DE UM PARA OUTRO") -or $text.Contains("SAIDA DE UM PRODUTO PARA OUTRO")) { return "Saida de um para outro" }
  if ($text.Contains("FRIOS") -or $text.Contains("CONGELADOS")) { return "Frios e Congelados" }
  if ($text.Contains("MERCEARIA")) { return "Mercearia" }
  if ($text.Contains("HORTIFRUTI")) { return "Hortifruti" }
  if ($text.Contains("ADMINISTRATIVO")) { return "Administrativo" }
  if ($text.Contains("FRENTE DE CAIXA")) { return "Frente de Caixa" }
  if ($text.Contains("FATIACAO")) { return "Fatiacao" }
  if ($text.Contains("LOJA") -or $text.Contains("DEPOSITO")) { return "Loja/Deposito" }
  return "Nao classificado"
}

function Convert-Decimal([string]$value) {
  if ([string]::IsNullOrWhiteSpace($value)) { return 0 }
  $normalized = $value.Replace(",", ".")
  try {
    return [decimal]::Parse($normalized, [System.Globalization.CultureInfo]::InvariantCulture)
  } catch {
    return 0
  }
}

function Get-RelativePath([string]$rootPath, [string]$filePath) {
  $rootUri = [System.Uri]((Resolve-Path $rootPath).Path.TrimEnd("\") + "\")
  $fileUri = [System.Uri](Resolve-Path $filePath).Path
  return [System.Uri]::UnescapeDataString($rootUri.MakeRelativeUri($fileUri).ToString()).Replace("/", "\")
}

function Parse-XmlFile([string]$filePath, [string]$rootPath) {
  [xml]$xmlDoc = Get-Content -Path $filePath -Raw
  $ide = $xmlDoc.SelectSingleNode("//*[local-name()='ide']")
  $emit = $xmlDoc.SelectSingleNode("//*[local-name()='emit']")
  $detNodes = $xmlDoc.SelectNodes("//*[local-name()='det']")

  $operation = Get-NodeText $ide "natOp"
  if (-not $operation) { $operation = "SEM OPERACAO" }

  $invoice = Get-NodeText $ide "nNF"
  if (-not $invoice) { $invoice = "-" }

  $date = Get-NodeText $ide "dhEmi"
  if (-not $date) { $date = Get-NodeText $ide "dEmi" }

  $store = Get-SafeStore ((Get-NodeText $emit "xFant"))
  if (-not $store) { $store = Get-SafeStore ((Get-NodeText $emit "xNome")) }

  $accessKey = Get-AccessKey $xmlDoc
  $noteKey = if ($accessKey) { $accessKey } else { "{0}::{1}::{2}::{3}" -f $invoice, $store, $date, $operation }
  $type = Get-ClassifiedType $operation
  $sourceFile = Get-RelativePath $rootPath $filePath

  $items = New-Object System.Collections.Generic.List[object]
  $index = 0

  foreach ($det in $detNodes) {
    $index += 1
    $prod = $det.SelectSingleNode(".//*[local-name()='prod']")
    $product = Get-NodeText $prod "xProd"
    if (-not $product) { $product = "Produto" }
    $sector = Get-ClassifiedSector $operation $product
    $quantity = Convert-Decimal (Get-NodeText $prod "qCom")
    $unitValue = Convert-Decimal (Get-NodeText $prod "vUnCom")
    $value = Convert-Decimal (Get-NodeText $prod "vProd")
    $itemId = "{0}::{1}" -f $noteKey, $index

    $items.Add([ordered]@{
      id = $itemId
      note_key = $noteKey
      item_index = $index
      access_key = if ($accessKey) { $accessKey } else { $null }
      source_file = $sourceFile
      invoice = $invoice
      store = $store
      emission_date = if ($date) { $date } else { $null }
      emission_month = Get-MonthKey $date
      competence_month = Get-CompetenceKey $date
      operation = $operation
      type = $type
      display_type = Get-DetailType $type $sector
      sector = $sector
      sector_manual = $false
      product = $product
      quantity = [double]$quantity
      unit_value = [double]$unitValue
      value = [double]$value
      reason = ""
      selected = $false
    })
  }

  $totalValue = 0.0
  foreach ($item in $items) {
    $totalValue += [double]$item.value
  }
  $firstSector = if ($items.Count -gt 0) { $items[0].sector } else { "Nao classificado" }

  return [ordered]@{
    note = [ordered]@{
      note_key = $noteKey
      access_key = if ($accessKey) { $accessKey } else { $null }
      source_file = $sourceFile
      invoice = $invoice
      store = $store
      emission_date = if ($date) { $date } else { $null }
      emission_month = Get-MonthKey $date
      competence_month = Get-CompetenceKey $date
      operation = $operation
      type = $type
      display_type = Get-DetailType $type $firstSector
      sector = $firstSector
      sector_manual = $false
      total_value = [double]$totalValue
      item_count = $items.Count
    }
    items = $items
  }
}

function Get-Chunks($items, [int]$size) {
  $chunks = @()
  for ($i = 0; $i -lt $items.Count; $i += $size) {
    $upper = [Math]::Min($i + $size - 1, $items.Count - 1)
    $chunks += ,@($items[$i..$upper])
  }
  return $chunks
}

function Invoke-SupabaseUpsert([string]$table, [string]$conflictColumn, $rows) {
  if (-not $rows -or $rows.Count -eq 0) { return }

  $uri = "$SupabaseUrl/rest/v1/$($table)?on_conflict=$conflictColumn"
  $headers = @{
    "apikey" = $SupabaseAnonKey
    "Authorization" = "Bearer $SupabaseAnonKey"
    "Prefer" = "resolution=merge-duplicates,return=minimal"
    "Content-Type" = "application/json"
  }

  $json = $rows | ConvertTo-Json -Depth 8 -Compress
  try {
    Invoke-WebRequest -Method Post -Uri $uri -Headers $headers -Body $json | Out-Null
  } catch {
    Write-Host "[erro] Falha no upsert da tabela $table com $($rows.Count) registro(s)." -ForegroundColor Red
    Write-Host "[erro] URI: $uri" -ForegroundColor Red
    if ($rows[0].Contains("note_key")) {
      Write-Host "[erro] Primeiro note_key: $($rows[0].note_key)" -ForegroundColor Red
    }
    if ($rows[0].Contains("id")) {
      Write-Host "[erro] Primeiro id: $($rows[0].id)" -ForegroundColor Red
    }
    if ($_.Exception.Response) {
      $stream = $_.Exception.Response.GetResponseStream()
      if ($stream) {
        $reader = New-Object System.IO.StreamReader($stream)
        $body = $reader.ReadToEnd()
        if ($body) {
          Write-Host "[erro] Resposta: $body" -ForegroundColor Red
        }
      }
    }
    throw
  }
}

$resolvedFolder = Resolve-Path $FolderPath -ErrorAction Stop
$xmlFiles = Get-ChildItem -Path $resolvedFolder -Recurse -File -Filter *.xml | Sort-Object FullName

if (-not $xmlFiles) {
  throw "Nenhum arquivo XML foi encontrado em '$FolderPath'."
}

Write-Info ("Pasta base: {0}" -f $resolvedFolder)
Write-Info ("XMLs encontrados: {0}" -f $xmlFiles.Count)

$entriesByNoteKey = @{}
$invalidFiles = New-Object System.Collections.Generic.List[string]

foreach ($file in $xmlFiles) {
  try {
    $entry = Parse-XmlFile -filePath $file.FullName -rootPath $resolvedFolder
    $entriesByNoteKey[$entry.note.note_key] = $entry
  } catch {
    $invalidFiles.Add($file.FullName)
    Write-Host "[erro] Falha ao ler $($file.FullName): $($_.Exception.Message)" -ForegroundColor Red
  }
}

$entries = @($entriesByNoteKey.Values)
$noteRows = @($entries | ForEach-Object { $_.note })
$itemRows = @($entries | ForEach-Object { $_.items } | ForEach-Object { $_ })

Write-Info ("Notas validas: {0}" -f $noteRows.Count)
Write-Info ("Itens validos: {0}" -f $itemRows.Count)

if ($invalidFiles.Count -gt 0) {
  Write-Host "[aviso] Arquivos ignorados: $($invalidFiles.Count)" -ForegroundColor Yellow
}

if ($DryRun) {
  Write-Success "Dry run concluido. Nenhum dado foi enviado ao Supabase."
  return
}

foreach ($chunk in (Get-Chunks -items $noteRows -size $NotesChunkSize)) {
  Invoke-SupabaseUpsert -table $NotesTable -conflictColumn "note_key" -rows $chunk
}

foreach ($chunk in (Get-Chunks -items $itemRows -size $ItemsChunkSize)) {
  Invoke-SupabaseUpsert -table $ItemsTable -conflictColumn "id" -rows $chunk
}

Write-Success ("Sincronizacao concluida. {0} nota(s) e {1} item(ns) enviados ao banco." -f $noteRows.Count, $itemRows.Count)
