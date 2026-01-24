import { describe, it, expect, beforeEach } from "vitest"
import { hiddenButLoadedCheck, checkHiddenButLoaded } from "./hiddenButLoaded"

describe("hiddenButLoadedCheck", () => {
  describe("meta", () => {
    it("has correct id", () => {
      expect(hiddenButLoadedCheck.meta.id).toBe("hidden-loaded")
    })

    it("has correct check number", () => {
      expect(hiddenButLoadedCheck.meta.checkNumber).toBe(4)
    })

    it("is highlightable", () => {
      expect(hiddenButLoadedCheck.meta.highlightable).toBe(true)
    })
  })

  describe("run", () => {
    beforeEach(() => {
      document.body.innerHTML = ""
    })

    it("returns 0 when no elements with data-source exist", () => {
      document.body.innerHTML = `
        <div>Regular div</div>
        <div style="display: none;">Hidden without data-source</div>
      `
      const result = hiddenButLoadedCheck.run()
      expect(result?.value).toBe(0)
      expect(result?.message).toContain("No hidden")
    })

    it("returns 0 when data-source elements are visible", () => {
      document.body.innerHTML = `
        <div data-source="some-data">Visible data source</div>
      `
      const result = hiddenButLoadedCheck.run()
      expect(result?.value).toBe(0)
    })

    it("counts hidden elements with data-source", () => {
      document.body.innerHTML = `
        <div data-source="data1" style="display: none;">Hidden 1</div>
        <div data-source="data2" style="display: none;">Hidden 2</div>
      `
      const result = hiddenButLoadedCheck.run()
      expect(result?.value).toBe(2)
      expect(result?.message).toContain("2 hidden elements")
    })

    it("returns elements array for highlighting", () => {
      document.body.innerHTML = `
        <div data-source="data1" style="display: none;">Hidden 1</div>
      `
      const result = hiddenButLoadedCheck.run()
      expect(result?.elements).toBeDefined()
      expect(result?.elements?.length).toBe(1)
    })

    it("does not return elements array when count is 0", () => {
      document.body.innerHTML = `
        <div data-source="data1">Visible</div>
      `
      const result = hiddenButLoadedCheck.run()
      expect(result?.elements).toBeUndefined()
    })

    it("does not count elements hidden by visibility: hidden", () => {
      // This check specifically looks for display: none
      document.body.innerHTML = `
        <div data-source="data1" style="visibility: hidden;">Invisible but displayed</div>
      `
      const result = hiddenButLoadedCheck.run()
      expect(result?.value).toBe(0)
    })

    it("handles mixed visible and hidden data-source elements", () => {
      document.body.innerHTML = `
        <div data-source="data1">Visible 1</div>
        <div data-source="data2" style="display: none;">Hidden 1</div>
        <div data-source="data3">Visible 2</div>
        <div data-source="data4" style="display: none;">Hidden 2</div>
      `
      const result = hiddenButLoadedCheck.run()
      expect(result?.value).toBe(2)
    })
  })
})

describe("checkHiddenButLoaded (legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("returns null when below threshold", () => {
    document.body.innerHTML = `
      <div data-source="data1" style="display: none;">Hidden 1</div>
    `
    const issue = checkHiddenButLoaded()
    expect(issue).toBeNull()
  })

  it("returns warning when above threshold", () => {
    // Create 25 hidden data-source elements (above 20 threshold)
    let html = ""
    for (let i = 0; i < 25; i++) {
      html += `<div data-source="data${i}" style="display: none;">Hidden ${i}</div>`
    }
    document.body.innerHTML = html

    const issue = checkHiddenButLoaded()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("warning")
    expect(issue?.count).toBe(25)
  })

  it("includes elements in issue", () => {
    let html = ""
    for (let i = 0; i < 25; i++) {
      html += `<div data-source="data${i}" style="display: none;">Hidden ${i}</div>`
    }
    document.body.innerHTML = html

    const issue = checkHiddenButLoaded()
    expect(issue?.elements).toBeDefined()
    expect(issue?.elements?.length).toBe(25)
  })
})
