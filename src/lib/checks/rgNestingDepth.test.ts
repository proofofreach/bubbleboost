import { describe, it, expect, beforeEach } from "vitest"
import { rgNestingDepthCheck, checkRgNestingDepth } from "./rgNestingDepth"

describe("rgNestingDepthCheck", () => {
  describe("meta", () => {
    it("has correct id", () => {
      expect(rgNestingDepthCheck.meta.id).toBe("rg-nesting")
    })

    it("has correct check number", () => {
      expect(rgNestingDepthCheck.meta.checkNumber).toBe(2)
    })

    it("is highlightable", () => {
      expect(rgNestingDepthCheck.meta.highlightable).toBe(true)
    })
  })

  describe("run", () => {
    beforeEach(() => {
      document.body.innerHTML = ""
    })

    it("returns 0 when no repeating groups exist", () => {
      document.body.innerHTML = `
        <div>Regular div</div>
        <div class="Group">Regular group</div>
      `
      const result = rgNestingDepthCheck.run()
      expect(result?.value).toBe(0)
      expect(result?.message).toContain("No nested")
    })

    it("returns 0 for flat repeating groups (no nesting)", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">RG 1</div>
        <div class="RepeatingGroup">RG 2</div>
      `
      const result = rgNestingDepthCheck.run()
      expect(result?.value).toBe(0)
    })

    it("detects single level nesting", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div class="RepeatingGroup">Nested RG</div>
        </div>
      `
      const result = rgNestingDepthCheck.run()
      expect(result?.value).toBe(1)
      expect(result?.message).toContain("1 levels deep")
    })

    it("detects multiple levels of nesting", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div class="RepeatingGroup">
            <div class="RepeatingGroup">Deep nested RG</div>
          </div>
        </div>
      `
      const result = rgNestingDepthCheck.run()
      expect(result?.value).toBe(2)
    })

    it("finds RGs by data-element-id containing RepeatingGroup", () => {
      document.body.innerHTML = `
        <div data-element-id="RepeatingGroup123">
          <div data-element-id="RepeatingGroup456">Nested</div>
        </div>
      `
      const result = rgNestingDepthCheck.run()
      expect(result?.value).toBe(1)
    })

    it("returns nested elements for highlighting", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup outer">
          <div class="RepeatingGroup nested">Nested RG</div>
        </div>
      `
      const result = rgNestingDepthCheck.run()
      expect(result?.elements).toBeDefined()
      expect(result?.elements?.length).toBeGreaterThan(0)
    })

    it("handles mixed class and data-element-id detection", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div data-element-id="RepeatingGroup456">Nested</div>
        </div>
      `
      const result = rgNestingDepthCheck.run()
      expect(result?.value).toBe(1)
    })
  })
})

describe("checkRgNestingDepth (legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("returns null when no nesting exists", () => {
    document.body.innerHTML = `<div class="RepeatingGroup">Single RG</div>`
    const issue = checkRgNestingDepth()
    expect(issue).toBeNull()
  })

  it("returns warning for nesting depth >= 2", () => {
    document.body.innerHTML = `
      <div class="RepeatingGroup">
        <div class="RepeatingGroup">
          <div class="RepeatingGroup">Deep</div>
        </div>
      </div>
    `
    const issue = checkRgNestingDepth()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("warning")
  })

  it("returns critical for nesting depth >= 3", () => {
    document.body.innerHTML = `
      <div class="RepeatingGroup">
        <div class="RepeatingGroup">
          <div class="RepeatingGroup">
            <div class="RepeatingGroup">Very deep</div>
          </div>
        </div>
      </div>
    `
    const issue = checkRgNestingDepth()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("critical")
  })
})
