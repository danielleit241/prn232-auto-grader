FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS base
WORKDIR /app

# dotnet CLI cần có trong runtime image để chạy student artifacts
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final-base
WORKDIR /app

FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

# Copy csproj files và restore
COPY GradingSystem.Domain/GradingSystem.Domain.csproj                 GradingSystem.Domain/
COPY GradingSystem.Application/GradingSystem.Application.csproj       GradingSystem.Application/
COPY GradingSystem.Infrastructure/GradingSystem.Infrastructure.csproj GradingSystem.Infrastructure/
COPY GradingSystem.Worker/GradingSystem.Worker.csproj                 GradingSystem.Worker/
RUN dotnet restore GradingSystem.Worker/GradingSystem.Worker.csproj

# Copy source và build
COPY GradingSystem.Domain/           GradingSystem.Domain/
COPY GradingSystem.Application/      GradingSystem.Application/
COPY GradingSystem.Infrastructure/   GradingSystem.Infrastructure/
COPY GradingSystem.Worker/           GradingSystem.Worker/
RUN dotnet publish GradingSystem.Worker/GradingSystem.Worker.csproj -c Release -o /app/publish --no-restore

# Dùng SDK image (không phải aspnet) vì Worker cần dotnet để chạy student artifacts
FROM mcr.microsoft.com/dotnet/sdk:8.0 AS final
WORKDIR /app
COPY --from=build /app/publish .
ENTRYPOINT ["dotnet", "GradingSystem.Worker.dll"]
