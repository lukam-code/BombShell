import { describe, expect, it } from "vitest";
import { formatPhoneLocal, normalizeSerbianPhone } from "../lib/phone";

describe("normalizeSerbianPhone", () => {
  it.each([
    ["065 662 6031", "+381656626031"],
    ["0656626031", "+381656626031"],
    ["+381 65 662 6031", "+381656626031"],
    ["+381656626031", "+381656626031"],
    ["00381656626031", "+381656626031"],
    ["381656626031", "+381656626031"],
    ["064/123-456", "+38164123456"],
    ["(060) 123 4567", "+381601234567"],
  ])("%s → %s", (input, expected) => {
    expect(normalizeSerbianPhone(input)).toBe(expected);
  });

  it.each(["", "021 123 456", "+385911234567", "06512", "065 662 6031 999", "abc"])("odbija %s", (input) => {
    expect(normalizeSerbianPhone(input)).toBeNull();
  });

  it("formatira lokalno", () => {
    expect(formatPhoneLocal("+381656626031")).toBe("065 662 6031");
  });
});

import { normalizeSerbianPhoneAny } from "../lib/phone";
describe("normalizeSerbianPhoneAny (admin)", () => {
  it("prihvata fiksni broj", () => expect(normalizeSerbianPhoneAny("021 123 456")).toBe("+38121123456"));
  it("prihvata mobilni", () => expect(normalizeSerbianPhoneAny("065 662 6031")).toBe("+381656626031"));
  it("odbija smeće", () => expect(normalizeSerbianPhoneAny("123")).toBeNull());
});
