import { describe, it, expect, beforeEach } from "vitest"
import { elementCountCheck, checkElementCount } from "./elementCount"

describe("elementCountCheck", () => {
  describe("meta", () => {
    it("has correct id", () => {
      expect(elementCountCheck.meta.id).toBe("element-count")
    })

    it("has correct check number", () => {
      expect(elementCountCheck.meta.checkNumber).toBe(1)
    })

    it("is not highlightable (aggregate check)", () => {
      expect(elementCountCheck.meta.highlightable).toBe(false)
    })

    it("has benchmark text", () => {
      expect(elementCountCheck.meta.benchmark).toContain("100")
    })
  })

  describe("run", () => {
    beforeEach(() => {
      document.body.innerHTML = ""
    })

    it("returns 0 when no Bubble elements exist", () => {
      document.body.innerHTML = `
        <div>Regular div</div>
        <span>Regular span</span>
      `
      const result = elementCountCheck.run()
      expect(result?.value).toBe(0)
    })

    it("counts elements with data-element-id", () => {
      document.body.innerHTML = `
        <div data-element-id="el1">Element 1</div>
        <div data-element-id="el2">Element 2</div>
        <div data-element-id="el3">Element 3</div>
      `
      const result = elementCountCheck.run()
      expect(result?.value).toBe(3)
    })

    it("counts elements with bubble-element class", () => {
      document.body.innerHTML = `
        <div class="bubble-element">Element 1</div>
        <div class="bubble-element-text">Element 2</div>
        <div class="some-bubble-element-class">Element 3</div>
      `
      const result = elementCountCheck.run()
      expect(result?.value).toBe(3)
    })

    it("does not double count elements with both markers", () => {
      document.body.innerHTML = `
        <div data-element-id="el1" class="bubble-element">Element 1</div>
        <div data-element-id="el2">Element 2</div>
        <div class="bubble-element">Element 3</div>
      `
      const result = elementCountCheck.run()
      expect(result?.value).toBe(3)
    })

    it("includes count in message", () => {
      document.body.innerHTML = `
        <div data-element-id="el1">Element 1</div>
        <div data-element-id="el2">Element 2</div>
      `
      const result = elementCountCheck.run()
      expect(result?.message).toContain("2")
    })

    it("does not return elements array (not highlightable)", () => {
      document.body.innerHTML = `
        <div data-element-id="el1">Element 1</div>
      `
      const result = elementCountCheck.run()
      expect(result?.elements).toBeUndefined()
    })
  })
})

describe("checkElementCount (legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("returns null when below threshold", () => {
    document.body.innerHTML = `
      <div data-element-id="el1">Element 1</div>
    `
    const issue = checkElementCount()
    expect(issue).toBeNull()
  })

  it("returns warning issue when above warning threshold", () => {
    // Create 250 elements (above 200 warning threshold)
    let html = ""
    for (let i = 0; i < 250; i++) {
      html += `<div data-element-id="el${i}">Element ${i}</div>`
    }
    document.body.innerHTML = html

    const issue = checkElementCount()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("warning")
    expect(issue?.count).toBe(250)
  })

  it("returns critical issue when above critical threshold", () => {
    // Create 550 elements (above 500 critical threshold)
    let html = ""
    for (let i = 0; i < 550; i++) {
      html += `<div data-element-id="el${i}">Element ${i}</div>`
    }
    document.body.innerHTML = html

    const issue = checkElementCount()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("critical")
    expect(issue?.count).toBe(550)
  })
})
