import { describe, it, expect, beforeEach } from "vitest"
import { visibleOnLoadCheck, checkVisibleOnLoad } from "./visibleOnLoad"

describe("visibleOnLoadCheck", () => {
  describe("meta", () => {
    it("has correct id", () => {
      expect(visibleOnLoadCheck.meta.id).toBe("visible-on-load")
    })

    it("has correct check number", () => {
      expect(visibleOnLoadCheck.meta.checkNumber).toBe(3)
    })

    it("is not highlightable (aggregate check)", () => {
      expect(visibleOnLoadCheck.meta.highlightable).toBe(false)
    })
  })

  describe("run", () => {
    beforeEach(() => {
      document.body.innerHTML = ""
    })

    it("returns 0 when no Bubble elements exist", () => {
      document.body.innerHTML = `<div>Regular div</div>`
      const result = visibleOnLoadCheck.run()
      expect(result?.value).toBe(0)
    })

    it("counts visible elements with data-element-id", () => {
      document.body.innerHTML = `
        <div data-element-id="el1">Element 1</div>
        <div data-element-id="el2">Element 2</div>
      `
      const result = visibleOnLoadCheck.run()
      expect(result?.value).toBe(2)
    })

    it("excludes elements with display: none", () => {
      document.body.innerHTML = `
        <div data-element-id="el1">Visible</div>
        <div data-element-id="el2" style="display: none;">Hidden</div>
      `
      const result = visibleOnLoadCheck.run()
      expect(result?.value).toBe(1)
    })

    it("excludes elements with visibility: hidden", () => {
      document.body.innerHTML = `
        <div data-element-id="el1">Visible</div>
        <div data-element-id="el2" style="visibility: hidden;">Invisible</div>
      `
      const result = visibleOnLoadCheck.run()
      expect(result?.value).toBe(1)
    })

    it("counts elements with bubble-element class", () => {
      document.body.innerHTML = `
        <div class="bubble-element">Element 1</div>
        <div class="bubble-element" style="display: none;">Hidden</div>
      `
      const result = visibleOnLoadCheck.run()
      expect(result?.value).toBe(1)
    })

    it("does not double count elements with both markers", () => {
      document.body.innerHTML = `
        <div data-element-id="el1" class="bubble-element">Element 1</div>
      `
      const result = visibleOnLoadCheck.run()
      expect(result?.value).toBe(1)
    })

    it("includes count in message", () => {
      document.body.innerHTML = `
        <div data-element-id="el1">Element 1</div>
        <div data-element-id="el2">Element 2</div>
      `
      const result = visibleOnLoadCheck.run()
      expect(result?.message).toContain("2")
    })
  })
})

describe("checkVisibleOnLoad (legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("returns null when below threshold", () => {
    document.body.innerHTML = `
      <div data-element-id="el1">Element 1</div>
    `
    const issue = checkVisibleOnLoad()
    expect(issue).toBeNull()
  })

  it("returns warning when above warning threshold", () => {
    // Create 60 visible elements (above 50 warning threshold)
    let html = ""
    for (let i = 0; i < 60; i++) {
      html += `<div data-element-id="el${i}">Element ${i}</div>`
    }
    document.body.innerHTML = html

    const issue = checkVisibleOnLoad()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("warning")
  })

  it("returns critical when above critical threshold", () => {
    // Create 110 visible elements (above 100 critical threshold)
    let html = ""
    for (let i = 0; i < 110; i++) {
      html += `<div data-element-id="el${i}">Element ${i}</div>`
    }
    document.body.innerHTML = html

    const issue = checkVisibleOnLoad()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("critical")
  })

  it("does not count hidden elements toward threshold", () => {
    // Create 60 elements but half are hidden
    let html = ""
    for (let i = 0; i < 60; i++) {
      const hidden = i % 2 === 0 ? 'style="display: none;"' : ""
      html += `<div data-element-id="el${i}" ${hidden}>Element ${i}</div>`
    }
    document.body.innerHTML = html

    const issue = checkVisibleOnLoad()
    // 30 visible, below warning threshold
    expect(issue).toBeNull()
  })
})
