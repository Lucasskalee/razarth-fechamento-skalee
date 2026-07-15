// Domain layer - Core business logic
namespace Razarth.Core.Domain;

public interface IDomainEvent
{
    DateTime OccurredAt { get; }
}
