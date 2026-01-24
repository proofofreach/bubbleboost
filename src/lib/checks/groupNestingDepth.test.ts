import { describe, it, expect, beforeEach } from "vitest"
import { groupNestingDepthCheck, checkGroupNestingDepth } from "./groupNestingDepth"

describe("groupNestingDepthCheck", () => {
  describe("meta", () => {
    it("has correct id", () => {
      expect(groupNestingDepthCheck.meta.id).toBe("group-nesting")
    })

    it("has correct check number", () => {
      expect(groupNestingDepthCheck.meta.checkNumber).toBe(7)
    })

    it("is highlightable", () => {
      expect(groupNestingDepthCheck.meta.highlightable).toBe(true)
    })
  })

  describe("run", () => {
    beforeEach(() => {
      document.body.innerHTML = ""
    })

    it("returns 0 when no groups exist", () => {
      document.body.innerHTML = `<div>No groups</div>`
      const result = groupNestingDepthCheck.run()
      expect(result?.value).toBe(0)
      expect(result?.message).toContain("No groups found")
    })

    it("returns 1 for a single group (depth of 1)", () => {
      document.body.innerHTML = `<div class="Group">Single group</div>`
      const result = groupNestingDepthCheck.run()
      expect(result?.value).toBe(1)
    })

    it("counts nested groups correctly", () => {
      document.body.innerHTML = `
        <div class="Group">
          <div class="Group">
            <div class="Group">Deep group</div>
          </div>
        </div>
      `
      const result = groupNestingDepthCheck.run()
      expect(result?.value).toBe(3)
    })

    it("finds groups by data-element-id containing Group", () => {
      document.body.innerHTML = `
        <div data-element-id="Group123">
          <div data-element-id="Group456">Nested</div>
        </div>
      `
      const result = groupNestingDepthCheck.run()
      expect(result?.value).toBe(2)
    })

    it("excludes RepeatingGroup from group count", () => {
      document.body.innerHTML = `
        <div class="Group">
          <div class="RepeatingGroup">
            <div class="Group">Inside RG</div>
          </div>
        </div>
      `
      const result = groupNestingDepthCheck.run()
      // Group > (RepeatingGroup excluded) > Group = depth 2 (not 3)
      expect(result?.value).toBe(2)
    })

    it("excludes RepeatingGroup by data-element-id", () => {
      document.body.innerHTML = `
        <div data-element-id="Group123">
          <div data-element-id="RepeatingGroup456">
            <div data-element-id="Group789">Inside RG</div>
          </div>
        </div>
      `
      const result = groupNestingDepthCheck.run()
      expect(result?.value).toBe(2)
    })

    it("returns deepest chain elements for highlighting", () => {
      document.body.innerHTML = `
        <div class="Group outer">
          <div class="Group middle">
            <div class="Group inner">Deep</div>
          </div>
        </div>
      `
      const result = groupNestingDepthCheck.run()
      expect(result?.elements).toBeDefined()
      expect(result?.elements?.length).toBe(3)
    })

    it("does not return elements when no groups", () => {
      document.body.innerHTML = `<div>No groups</div>`
      const result = groupNestingDepthCheck.run()
      expect(result?.elements).toBeUndefined()
    })

    it("handles mixed class and data-element-id detection", () => {
      document.body.innerHTML = `
        <div class="Group">
          <div data-element-id="Group456">Nested</div>
        </div>
      `
      const result = groupNestingDepthCheck.run()
      expect(result?.value).toBe(2)
    })

    it("finds the deepest chain across multiple branches", () => {
      document.body.innerHTML = `
        <div class="Group">
          <div class="Group">Shallow branch</div>
        </div>
        <div class="Group">
          <div class="Group">
            <div class="Group">
              <div class="Group">Deep branch</div>
            </div>
          </div>
        </div>
      `
      const result = groupNestingDepthCheck.run()
      expect(result?.value).toBe(4)
    })
  })
})

describe("checkGroupNestingDepth (legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("returns null when below threshold", () => {
    document.body.innerHTML = `
      <div class="Group">
        <div class="Group">
          <div class="Group">Depth 3</div>
        </div>
      </div>
    `
    const issue = checkGroupNestingDepth()
    expect(issue).toBeNull()
  })

  it("returns warning when above warning threshold (>5)", () => {
    document.body.innerHTML = `
      <div class="Group">
        <div class="Group">
          <div class="Group">
            <div class="Group">
              <div class="Group">
                <div class="Group">Depth 6</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const issue = checkGroupNestingDepth()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("warning")
  })

  it("returns critical when above critical threshold (>8)", () => {
    let html = '<div class="Group">'
    for (let i = 0; i < 8; i++) {
      html += '<div class="Group">'
    }
    html += 'Deep'
    for (let i = 0; i < 9; i++) {
      html += '</div>'
    }
    document.body.innerHTML = html

    const issue = checkGroupNestingDepth()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("critical")
  })

  it("includes deepest chain in issue elements", () => {
    document.body.innerHTML = `
      <div class="Group">
        <div class="Group">
          <div class="Group">
            <div class="Group">
              <div class="Group">
                <div class="Group">Depth 6</div>
              </div>
            </div>
          </div>
        </div>
      </div>
    `
    const issue = checkGroupNestingDepth()
    expect(issue?.elements).toBeDefined()
    expect(issue?.elements?.length).toBe(6)
  })
})
