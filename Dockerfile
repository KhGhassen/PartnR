FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src

COPY backend/PartnR.Api/PartnR.Api.csproj backend/PartnR.Api/
RUN dotnet restore backend/PartnR.Api/PartnR.Api.csproj

COPY backend/ backend/
RUN dotnet publish backend/PartnR.Api/PartnR.Api.csproj -c Release -o /app/publish

FROM mcr.microsoft.com/dotnet/aspnet:8.0 AS runtime
WORKDIR /app
COPY --from=build /app/publish .

EXPOSE 5000
ENV ASPNETCORE_URLS=http://+:5000
ENTRYPOINT ["dotnet", "PartnR.Api.dll"]
