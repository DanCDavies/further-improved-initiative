describe("/e/:id route", () => {
  test("should parse query string from req.originalUrl without BASE_URL", () => {
    // Simulate the logic used in the /e/:id route handler
    const originalUrl = "/e/abc123?restore=true&foo=bar";
    const queryString = originalUrl.includes("?")
      ? originalUrl.substring(originalUrl.indexOf("?"))
      : "";
    expect(queryString).toBe("?restore=true&foo=bar");
  });

  test("should produce empty query string when no query params present", () => {
    const originalUrl = "/e/abc123";
    const queryString = originalUrl.includes("?")
      ? originalUrl.substring(originalUrl.indexOf("?"))
      : "";
    expect(queryString).toBe("");
  });
});
