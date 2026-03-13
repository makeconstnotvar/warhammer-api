window.addEventListener("load", function initializeSwaggerUi() {
  document.title = "Warhammer 40K API Reference";

  window.ui = SwaggerUIBundle({
    deepLinking: true,
    displayRequestDuration: true,
    docExpansion: "list",
    dom_id: "#swagger-ui",
    filter: true,
    layout: "StandaloneLayout",
    persistAuthorization: false,
    presets: [SwaggerUIBundle.presets.apis, SwaggerUIStandalonePreset],
    spec: undefined,
    supportedSubmitMethods: ["get"],
    tryItOutEnabled: true,
    url: "/api/v1/openapi.json",
  });
});
