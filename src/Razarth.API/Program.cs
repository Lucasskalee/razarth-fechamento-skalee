namespace Razarth.API;

public class Program
{
    public static void Main(string[] args)
    {
        var builder = WebApplication.CreateBuilder(args);

        // Add services
        builder.Services.AddControllers();
        builder.Services.AddEndpointsApiExplorer();
        builder.Services.AddSwaggerGen();

        var app = builder.Build();

        // Configure middleware
        if (app.Environment.IsDevelopment())
        {
            app.UseSwagger();
            app.UseSwaggerUI();
        }

        app.UseHttpsRedirection();
        app.UseAuthorization();
        app.MapControllers();

        // Health check endpoint
        app.MapGet("/health", () =>
        {
            return Results.Ok(new { status = "Healthy", timestamp = DateTime.UtcNow });
        })
        .WithName("Health")
        .WithOpenApi()
        .AllowAnonymous();

        app.Run();
    }
}
