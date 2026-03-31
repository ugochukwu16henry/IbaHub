FROM mcr.microsoft.com/dotnet/sdk:8.0 AS build
WORKDIR /src
COPY . ./
RUN dotnet restore ./Ibahub.PdfService.csproj
RUN dotnet publish ./Ibahub.PdfService.csproj -c Release -o /out /p:UseAppHost=false

FROM mcr.microsoft.com/dotnet/aspnet:8.0
WORKDIR /app
COPY --from=build /out ./
EXPOSE 7071
ENV ASPNETCORE_URLS=http://+:7071
ENTRYPOINT ["dotnet", "Ibahub.PdfService.dll"]
