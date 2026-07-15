# Telemetria — Dados em Vez de Adivinhação

> **Quando cliente disser "está lento", você terá dados, não especulação.**

---

## O Que Registrar

```
Request Duration (ms)
Error Rate (%)
Exception Stack Traces
Module Usage (por empresa)
AI Token Consumption
Database Query Time
Cache Hit Rate
Feature Flag Toggles
```

---

## Estrutura

### Request Telemetry

```csharp
public class RequestTelemetry
{
    public Guid RequestId { get; set; }
    public Guid CompanyId { get; set; }
    public string Module { get; set; }
    public string Endpoint { get; set; }
    public string Method { get; set; }
    public long DurationMs { get; set; }
    public int StatusCode { get; set; }
    public DateTime Timestamp { get; set; }
}
```

### Erro Telemetry

```csharp
public class ErrorTelemetry
{
    public Guid ErrorId { get; set; }
    public Guid? CompanyId { get; set; }
    public string ExceptionType { get; set; }
    public string Message { get; set; }
    public string StackTrace { get; set; }
    public string Module { get; set; }
    public DateTime Timestamp { get; set; }
    public Dictionary<string, string> Context { get; set; }
}
```

### Analytics Telemetry

```csharp
public class AnalyticsTelemetry
{
    public Guid CompanyId { get; set; }
    public string AnalysisType { get; set; }  // "anomaly", "trend", "score"
    public long DurationMs { get; set; }
    public int RecordsProcessed { get; set; }
    public string AlgorithmVersion { get; set; }
    public DateTime Timestamp { get; set; }
}
```

### AI Telemetry

```csharp
public class AITelemetry
{
    public Guid CompanyId { get; set; }
    public string Model { get; set; }  // "openai", "claude", "gemini"
    public int PromptTokens { get; set; }
    public int CompletionTokens { get; set; }
    public long DurationMs { get; set; }
    public decimal CostEstimate { get; set; }
    public string Task { get; set; }  // "generate_description", "analyze_anomaly"
    public DateTime Timestamp { get; set; }
}
```

---

## Middleware de Telemetria

```csharp
namespace Razarth.API.Middleware;

public class TelemetryMiddleware
{
    private readonly RequestDelegate _next;
    private readonly ITelemetryService _telemetry;
    private readonly ILogger<TelemetryMiddleware> _logger;
    
    public TelemetryMiddleware(
        RequestDelegate next,
        ITelemetryService telemetry,
        ILogger<TelemetryMiddleware> logger
    )
    {
        _next = next;
        _telemetry = telemetry;
        _logger = logger;
    }
    
    public async Task InvokeAsync(HttpContext context)
    {
        var requestId = Guid.NewGuid();
        var sw = System.Diagnostics.Stopwatch.StartNew();
        
        context.Items["RequestId"] = requestId;
        context.Items["StartTime"] = DateTime.UtcNow;
        
        try
        {
            await _next(context);
        }
        finally
        {
            sw.Stop();
            
            var companyId = context.GetTenantId();
            var telemetry = new RequestTelemetry
            {
                RequestId = requestId,
                CompanyId = companyId ?? Guid.Empty,
                Module = ExtractModule(context.Request.Path),
                Endpoint = context.Request.Path,
                Method = context.Request.Method,
                DurationMs = sw.ElapsedMilliseconds,
                StatusCode = context.Response.StatusCode,
                Timestamp = DateTime.UtcNow
            };
            
            await _telemetry.RecordRequestAsync(telemetry);
            
            // Log se lento (>1 segundo)
            if (sw.ElapsedMilliseconds > 1000)
            {
                _logger.LogWarning(
                    "Slow request: {Method} {Path} took {DurationMs}ms",
                    context.Request.Method,
                    context.Request.Path,
                    sw.ElapsedMilliseconds
                );
            }
        }
    }
}
```

---

## Serviço de Telemetria

```csharp
namespace Razarth.Application.Telemetry;

public interface ITelemetryService
{
    Task RecordRequestAsync(RequestTelemetry telemetry);
    Task RecordErrorAsync(ErrorTelemetry telemetry);
    Task RecordAnalyticsAsync(AnalyticsTelemetry telemetry);
    Task RecordAIUsageAsync(AITelemetry telemetry);
}

public class TelemetryService : ITelemetryService
{
    private readonly RazarthDbContext _db;
    private readonly ILogger<TelemetryService> _logger;
    
    public async Task RecordRequestAsync(RequestTelemetry telemetry)
    {
        try
        {
            _db.RequestTelemetries.Add(telemetry);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            // Não quebrar request se falhar telemetria
            _logger.LogError(ex, "Failed to record telemetry");
        }
    }
    
    public async Task RecordErrorAsync(ErrorTelemetry telemetry)
    {
        try
        {
            _db.ErrorTelemetries.Add(telemetry);
            await _db.SaveChangesAsync();
        }
        catch (Exception ex)
        {
            _logger.LogError(ex, "Failed to record error telemetry");
        }
    }
    
    // ... outros métodos
}
```

---

## Usar em Código

### Request Telemetry (automático via middleware)

```csharp
// Middleware já registra automaticamente
```

### Error Telemetry (manual)

```csharp
try
{
    await _service.DoSomethingAsync();
}
catch (Exception ex)
{
    var telemetry = new ErrorTelemetry
    {
        ErrorId = Guid.NewGuid(),
        CompanyId = HttpContext.GetTenantId(),
        ExceptionType = ex.GetType().Name,
        Message = ex.Message,
        StackTrace = ex.StackTrace,
        Module = "Supermarket",
        Timestamp = DateTime.UtcNow,
        Context = new()
        {
            ["endpoint"] = HttpContext.Request.Path,
            ["method"] = HttpContext.Request.Method
        }
    };
    
    await _telemetry.RecordErrorAsync(telemetry);
    throw;
}
```

### Analytics Telemetry

```csharp
public async Task<AnalysisResult> AnalyzeAnomaliesAsync(AnalysisRequest request)
{
    var sw = Stopwatch.StartNew();
    
    try
    {
        var result = await _engine.DetectAnomaliesAsync(request.Losses, request.Rules);
        
        sw.Stop();
        
        await _telemetry.RecordAnalyticsAsync(new AnalyticsTelemetry
        {
            CompanyId = HttpContext.GetTenantId().Value,
            AnalysisType = "anomaly",
            DurationMs = sw.ElapsedMilliseconds,
            RecordsProcessed = request.Losses.Count,
            AlgorithmVersion = "supermarket:anomaly:1.2",
            Timestamp = DateTime.UtcNow
        });
        
        return result;
    }
}
```

### AI Telemetry

```csharp
public async Task<string> GenerateDescriptionAsync(string shortText)
{
    var sw = Stopwatch.StartNew();
    
    var response = await _aiAssistant.AskAsync(new AIRequest
    {
        Message = shortText,
        CompanyId = companyId
    });
    
    sw.Stop();
    
    await _telemetry.RecordAIUsageAsync(new AITelemetry
    {
        CompanyId = companyId,
        Model = response.Model,
        PromptTokens = response.PromptTokens,
        CompletionTokens = response.CompletionTokens,
        DurationMs = sw.ElapsedMilliseconds,
        CostEstimate = CalculateCost(response),
        Task = "generate_description",
        Timestamp = DateTime.UtcNow
    });
    
    return response.Message;
}
```

---

## Dashboard de Telemetria

Exemplo de queries úteis:

```sql
-- Requisições mais lentas
SELECT 
    endpoint, 
    AVG(duration_ms) as avg_duration,
    COUNT(*) as total_requests
FROM request_telemetries
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY endpoint
ORDER BY avg_duration DESC
LIMIT 10;

-- Erros por módulo (últimas 24h)
SELECT 
    module,
    exception_type,
    COUNT(*) as error_count
FROM error_telemetries
WHERE timestamp > NOW() - INTERVAL '24 hours'
GROUP BY module, exception_type
ORDER BY error_count DESC;

-- AI Custo por empresa (último mês)
SELECT 
    company_id,
    SUM(cost_estimate) as total_cost,
    COUNT(*) as total_requests
FROM ai_telemetries
WHERE timestamp > NOW() - INTERVAL '30 days'
GROUP BY company_id
ORDER BY total_cost DESC;

-- Feature usage (últimas 2 semanas)
SELECT 
    company_id,
    module,
    analysis_type,
    COUNT(*) as usage_count
FROM analytics_telemetries
WHERE timestamp > NOW() - INTERVAL '14 days'
GROUP BY company_id, module, analysis_type;
```

---

## Registro de Eventos

**Struktur no banco:**

```sql
CREATE TABLE telemetry_events (
    id UUID PRIMARY KEY,
    event_type VARCHAR NOT NULL,        -- "request", "error", "analytics", "ai"
    company_id UUID,
    data JSONB NOT NULL,               -- dados específicos
    timestamp TIMESTAMP DEFAULT NOW(),
    
    INDEX(timestamp),
    INDEX(company_id),
    INDEX(event_type)
);
```

---

## Alertas

Quando telemetria excedem thresholds:

```
🔴 CRITICAL
  - Error rate > 5%
  - Request duration > 5 seconds
  - Database down

🟡 WARNING
  - Error rate > 2%
  - Request duration > 2 seconds
  - Cache hit rate < 80%
```

---

**Telemetria: Transformar problema em dados acionáveis.**
