# Domain Events — Infraestrutura Pronta Desde o Início

> **Mesmo que não use hoje, ter o caminho preparado economiza refatoração depois.**

---

## Interface Base

```csharp
namespace Razarth.Shared.Events;

/// <summary>
/// Evento de domínio. Imutável, aconteceu no passado.
/// </summary>
public interface IDomainEvent
{
    /// <summary>
    /// ID único do evento
    /// </summary>
    Guid EventId { get; }
    
    /// <summary>
    /// Quando o evento ocorreu
    /// </summary>
    DateTime OccurredAt { get; }
    
    /// <summary>
    /// Empresa (tenant) do evento
    /// </summary>
    Guid CompanyId { get; }
}

/// <summary>
/// Agregado que pode emitir eventos
/// </summary>
public interface IAggregateRoot
{
    /// <summary>
    /// Eventos pendentes de publicação
    /// </summary>
    IReadOnlyList<IDomainEvent> DomainEvents { get; }
    
    /// <summary>
    /// Limpar eventos após publicação
    /// </summary>
    void ClearDomainEvents();
}
```

---

## Exemplo de Evento

```csharp
namespace Razarth.Modules.Supermarket.Domain.Events;

public class LossRecordedEvent : IDomainEvent
{
    public Guid EventId { get; }
    public DateTime OccurredAt { get; }
    public Guid CompanyId { get; }
    
    public Guid LossId { get; }
    public Guid ProductId { get; }
    public int Quantity { get; }
    public decimal Value { get; }
    public LossType Type { get; }
    
    public LossRecordedEvent(
        Guid lossId, Guid companyId,
        Guid productId, int quantity,
        decimal value, LossType type
    )
    {
        EventId = Guid.NewGuid();
        OccurredAt = DateTime.UtcNow;
        CompanyId = companyId;
        LossId = lossId;
        ProductId = productId;
        Quantity = quantity;
        Value = value;
        Type = type;
    }
}

public class AnomalyDetectedEvent : IDomainEvent
{
    public Guid EventId { get; }
    public DateTime OccurredAt { get; }
    public Guid CompanyId { get; }
    
    public Guid LossId { get; }
    public decimal Score { get; }
    public string Reason { get; }
    
    public AnomalyDetectedEvent(Guid lossId, Guid companyId, decimal score, string reason)
    {
        EventId = Guid.NewGuid();
        OccurredAt = DateTime.UtcNow;
        CompanyId = companyId;
        LossId = lossId;
        Score = score;
        Reason = reason;
    }
}
```

---

## Agregado com Eventos

```csharp
namespace Razarth.Modules.Supermarket.Domain;

public class Loss : IAggregateRoot
{
    private readonly List<IDomainEvent> _domainEvents = new();
    
    public Guid Id { get; }
    public Guid CompanyId { get; }
    public Guid ProductId { get; }
    
    public DateTime Date { get; }
    public int Quantity { get; }
    public decimal Value { get; }
    public LossType Type { get; }
    
    public IReadOnlyList<IDomainEvent> DomainEvents => _domainEvents.AsReadOnly();
    
    public static Loss Create(
        Guid companyId, Guid productId,
        int quantity, decimal value, LossType type
    )
    {
        var loss = new Loss
        {
            Id = Guid.NewGuid(),
            CompanyId = companyId,
            ProductId = productId,
            Quantity = quantity,
            Value = value,
            Type = type,
            Date = DateTime.UtcNow
        };
        
        // Adicionar evento
        loss._domainEvents.Add(new LossRecordedEvent(
            loss.Id, companyId, productId, quantity, value, type
        ));
        
        return loss;
    }
    
    public void MarkAsAnomaly(decimal score, string reason)
    {
        _domainEvents.Add(new AnomalyDetectedEvent(
            this.Id, this.CompanyId, score, reason
        ));
    }
    
    public void ClearDomainEvents()
    {
        _domainEvents.Clear();
    }
}
```

---

## Despachador de Eventos

```csharp
namespace Razarth.Application.Events;

public interface IDomainEventDispatcher
{
    Task DispatchAsync(IDomainEvent @event);
    Task DispatchManyAsync(IEnumerable<IDomainEvent> events);
}

public class DomainEventDispatcher : IDomainEventDispatcher
{
    private readonly IServiceProvider _serviceProvider;
    private readonly ILogger<DomainEventDispatcher> _logger;
    
    public DomainEventDispatcher(
        IServiceProvider serviceProvider,
        ILogger<DomainEventDispatcher> logger
    )
    {
        _serviceProvider = serviceProvider;
        _logger = logger;
    }
    
    public async Task DispatchAsync(IDomainEvent @event)
    {
        var handlerType = typeof(IDomainEventHandler<>).MakeGenericType(@event.GetType());
        var handlers = _serviceProvider.GetServices(handlerType);
        
        foreach (var handler in handlers)
        {
            try
            {
                await (Task)handlerType
                    .GetMethod("HandleAsync")
                    .Invoke(handler, new object[] { @event });
                
                _logger.LogInformation(
                    "Event handled: {EventType} from Company {CompanyId}",
                    @event.GetType().Name,
                    @event.CompanyId
                );
            }
            catch (Exception ex)
            {
                _logger.LogError(
                    ex,
                    "Error handling event {EventType}",
                    @event.GetType().Name
                );
                throw;
            }
        }
    }
    
    public async Task DispatchManyAsync(IEnumerable<IDomainEvent> events)
    {
        foreach (var @event in events)
        {
            await DispatchAsync(@event);
        }
    }
}
```

---

## Handler de Eventos

```csharp
namespace Razarth.Application.Events;

public interface IDomainEventHandler<TEvent> where TEvent : IDomainEvent
{
    Task HandleAsync(TEvent @event);
}

// Exemplo: quando Loss é registrada, enviar notificação
public class LossRecordedEventHandler : IDomainEventHandler<LossRecordedEvent>
{
    private readonly INotificationService _notifications;
    
    public LossRecordedEventHandler(INotificationService notifications)
    {
        _notifications = notifications;
    }
    
    public async Task HandleAsync(LossRecordedEvent @event)
    {
        // Notificar quando perda é crítica
        if (@event.Value > 500)
        {
            await _notifications.SendEmailAsync(
                to: "admin@supermercado.com",
                subject: "Perda Significativa Registrada",
                body: $"Perda de R$ {@event.Value} registrada para {nameof(@event.ProductId)}"
            );
        }
    }
}

// Exemplo: quando Anomalia é detectada, logar para auditoria
public class AnomalyDetectedEventHandler : IDomainEventHandler<AnomalyDetectedEvent>
{
    private readonly IAuditLogger _auditLog;
    
    public AnomalyDetectedEventHandler(IAuditLogger auditLog)
    {
        _auditLog = auditLog;
    }
    
    public async Task HandleAsync(AnomalyDetectedEvent @event)
    {
        await _auditLog.LogAsync(new AuditEntry
        {
            CompanyId = @event.CompanyId,
            EventType = "ANOMALY_DETECTED",
            Details = $"Score: {@event.Score}, Reason: {@event.Reason}",
            Timestamp = @event.OccurredAt
        });
    }
}
```

---

## Registrar no DI

```csharp
// Program.cs
services.AddScoped<IDomainEventDispatcher, DomainEventDispatcher>();

// Registrar handlers
services.AddScoped<IDomainEventHandler<LossRecordedEvent>, LossRecordedEventHandler>();
services.AddScoped<IDomainEventHandler<AnomalyDetectedEvent>, AnomalyDetectedEventHandler>();
```

---

## Usar em Use Case

```csharp
public class RecordLossUseCase
{
    private readonly ILossRepository _repo;
    private readonly IDomainEventDispatcher _dispatcher;
    
    public async Task<Result<LossDTO>> ExecuteAsync(Guid companyId, RecordLossRequest request)
    {
        var loss = Loss.Create(companyId, request.ProductId, ...);
        
        await _repo.AddAsync(loss);
        await _unitOfWork.SaveChangesAsync();
        
        // Despachar eventos após salvar
        await _dispatcher.DispatchManyAsync(loss.DomainEvents);
        loss.ClearDomainEvents();
        
        return Result<LossDTO>.Success(_mapper.Map<LossDTO>(loss));
    }
}
```

---

## Quando Você Usará Isso

- **Auditoria:** Logar tudo que acontece
- **Notificações:** Enviar email/SMS quando evento ocorre
- **Integração:** Sincronizar com sistema externo
- **IA Reação:** IA analisa evento e sugere ação
- **Analytics:** Coletar métricas de uso

**Tendo a infraestrutura pronta, quando precisar, é um handler novo.**

---

**Domain Events: O caminho já está pronto.**
