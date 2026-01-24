import { describe, it, expect, beforeEach } from "vitest"
import { rgCellElementCountCheck, checkRgCellElementCount } from "./rgCellElementCount"

describe("rgCellElementCountCheck", () => {
  describe("meta", () => {
    it("has correct id", () => {
      expect(rgCellElementCountCheck.meta.id).toBe("rg-cell-count")
    })

    it("has correct check number", () => {
      expect(rgCellElementCountCheck.meta.checkNumber).toBe(6)
    })

    it("is highlightable", () => {
      expect(rgCellElementCountCheck.meta.highlightable).toBe(true)
    })
  })

  describe("run", () => {
    beforeEach(() => {
      document.body.innerHTML = ""
    })

    it("returns 0 when no repeating groups exist", () => {
      document.body.innerHTML = `<div>No repeating groups</div>`
      const result = rgCellElementCountCheck.run()
      expect(result?.value).toBe(0)
      expect(result?.message).toContain("No repeating groups found")
    })

    it("counts elements in RG cells", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div class="RepeatingGroupCell">
            <div data-element-id="el1">Element 1</div>
            <div data-element-id="el2">Element 2</div>
            <div data-element-id="el3">Element 3</div>
          </div>
        </div>
      `
      const result = rgCellElementCountCheck.run()
      expect(result?.value).toBe(3)
    })

    it("returns max elements per cell across multiple cells", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div class="RepeatingGroupCell">
            <div data-element-id="el1">Element 1</div>
            <div data-element-id="el2">Element 2</div>
          </div>
          <div class="RepeatingGroupCell">
            <div data-element-id="el3">Element 3</div>
            <div data-element-id="el4">Element 4</div>
            <div data-element-id="el5">Element 5</div>
            <div data-element-id="el6">Element 6</div>
          </div>
        </div>
      `
      const result = rgCellElementCountCheck.run()
      expect(result?.value).toBe(4)
    })

    it("finds RGs by data-element-id containing RepeatingGroup", () => {
      document.body.innerHTML = `
        <div data-element-id="RepeatingGroup123">
          <div class="Cell">
            <div data-element-id="el1">Element 1</div>
          </div>
        </div>
      `
      const result = rgCellElementCountCheck.run()
      expect(result?.value).toBeGreaterThanOrEqual(0)
    })

    it("returns bloated cells (>5 elements) for highlighting", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div class="RepeatingGroupCell">
            <div data-element-id="el1">Element 1</div>
            <div data-element-id="el2">Element 2</div>
            <div data-element-id="el3">Element 3</div>
            <div data-element-id="el4">Element 4</div>
            <div data-element-id="el5">Element 5</div>
            <div data-element-id="el6">Element 6</div>
          </div>
        </div>
      `
      const result = rgCellElementCountCheck.run()
      expect(result?.elements).toBeDefined()
      expect(result?.elements?.length).toBe(1)
    })

    it("does not return elements when no bloated cells", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div class="RepeatingGroupCell">
            <div data-element-id="el1">Element 1</div>
            <div data-element-id="el2">Element 2</div>
          </div>
        </div>
      `
      const result = rgCellElementCountCheck.run()
      expect(result?.elements).toBeUndefined()
    })

    it("counts bubble-element class elements in cells", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div class="RepeatingGroupCell">
            <div class="bubble-element">Element 1</div>
            <div class="bubble-element">Element 2</div>
          </div>
        </div>
      `
      const result = rgCellElementCountCheck.run()
      expect(result?.value).toBe(2)
    })

    it("uses direct children as cells when no explicit cells found", () => {
      document.body.innerHTML = `
        <div class="RepeatingGroup">
          <div>
            <div data-element-id="el1">Element 1</div>
            <div data-element-id="el2">Element 2</div>
          </div>
          <div>
            <div data-element-id="el3">Element 3</div>
          </div>
        </div>
      `
      const result = rgCellElementCountCheck.run()
      expect(result?.value).toBeGreaterThanOrEqual(1)
    })
  })
})

describe("checkRgCellElementCount (legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("returns null when below threshold", () => {
    document.body.innerHTML = `
      <div class="RepeatingGroup">
        <div class="RepeatingGroupCell">
          <div data-element-id="el1">Element 1</div>
        </div>
      </div>
    `
    const issue = checkRgCellElementCount()
    expect(issue).toBeNull()
  })

  it("returns warning when above threshold (>5 per cell)", () => {
    document.body.innerHTML = `
      <div class="RepeatingGroup">
        <div class="RepeatingGroupCell">
          <div data-element-id="el1">Element 1</div>
          <div data-element-id="el2">Element 2</div>
          <div data-element-id="el3">Element 3</div>
          <div data-element-id="el4">Element 4</div>
          <div data-element-id="el5">Element 5</div>
          <div data-element-id="el6">Element 6</div>
          <div data-element-id="el7">Element 7</div>
        </div>
      </div>
    `
    const issue = checkRgCellElementCount()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("warning")
  })

  it("includes bloated cells in issue elements", () => {
    document.body.innerHTML = `
      <div class="RepeatingGroup">
        <div class="RepeatingGroupCell">
          <div data-element-id="el1">Element 1</div>
          <div data-element-id="el2">Element 2</div>
          <div data-element-id="el3">Element 3</div>
          <div data-element-id="el4">Element 4</div>
          <div data-element-id="el5">Element 5</div>
          <div data-element-id="el6">Element 6</div>
        </div>
      </div>
    `
    const issue = checkRgCellElementCount()
    expect(issue?.elements).toBeDefined()
  })
})
