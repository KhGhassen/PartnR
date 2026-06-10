FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY PartnR.Api/PartnR.Api.csproj PartnR.Api/
COPY PartnR.Application/PartnR.Application.csproj PartnR.Application/
COPY PartnR.Infrastructure/PartnR.Infrastructure.csproj PartnR.Infrastructure/
COPY PartnR.Domain/PartnR.Domain.csproj PartnR.Domain/
RUN dotnet restore PartnR.Api/PartnR.Api.csproj

COPY . .
RUN dotnet publish PartnR.Api/PartnR.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "PartnR.Api.dll"]
