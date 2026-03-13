function getReferenceConfig(pathname) {
  if (pathname === "/legacy/reference") {
    return {
      documentTitle: "Warhammer 40K Legacy API Reference",
      url: "/api/openapi.json",
    };
  }

  return {
    documentTitle: "Warhammer 40K API Reference",
    url: "/api/v1/openapi.json",
  };
}

window.addEventListener("load", function initializeSwaggerUi() {
  const referenceConfig = getReferenceConfig(window.location.pathname);

  document.title = referenceConfig.documentTitle;

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
    url: referenceConfig.url,
  });
});
