using Microsoft.AspNetCore.SignalR;

namespace MyDemoApp.WebApi.Hubs;

public class AiStreamingHub : Hub
{
    public async Task JoinGroup(string groupName)
    {
        await Groups.AddToGroupAsync(Context.ConnectionId, groupName);
    }

    public async Task LeaveGroup(string groupName)
    {
        await Groups.RemoveFromGroupAsync(Context.ConnectionId, groupName);
    }

    public override async Task OnDisconnectedAsync(Exception? exception)
    {
        // Clean up any resources if needed
        await base.OnDisconnectedAsync(exception);
    }
}