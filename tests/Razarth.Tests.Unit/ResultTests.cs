namespace Razarth.Tests.Unit;

using Razarth.Core.Shared;

public class ResultTests
{
    [Fact]
    public void Success_CreatesSuccessResult()
    {
        var value = "test";
        var result = Result<string>.Success(value);

        Assert.True(result.IsSuccess);
        Assert.Equal(value, result.Value);
        Assert.Null(result.Error);
    }

    [Fact]
    public void Failure_CreatesFailureResult()
    {
        var error = "Something went wrong";
        var result = Result<string>.Failure(error);

        Assert.False(result.IsSuccess);
        Assert.Null(result.Value);
        Assert.Equal(error, result.Error);
    }
}
