import { describe, it, expect, beforeEach } from "vitest"
import { imagesWithoutDimensionsCheck, checkImagesWithoutDimensions } from "./imagesWithoutDimensions"

describe("imagesWithoutDimensionsCheck", () => {
  describe("meta", () => {
    it("has correct id", () => {
      expect(imagesWithoutDimensionsCheck.meta.id).toBe("images-no-dimensions")
    })

    it("has correct check number", () => {
      expect(imagesWithoutDimensionsCheck.meta.checkNumber).toBe(5)
    })

    it("is highlightable", () => {
      expect(imagesWithoutDimensionsCheck.meta.highlightable).toBe(true)
    })
  })

  describe("run", () => {
    beforeEach(() => {
      document.body.innerHTML = ""
    })

    it("returns 0 when no images exist", () => {
      document.body.innerHTML = `<div>No images</div>`
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(0)
      expect(result?.message).toContain("All images have explicit dimensions")
    })

    it("returns 0 for images with width and height attributes", () => {
      document.body.innerHTML = `
        <img src="test.jpg" width="100" height="100" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(0)
    })

    it("returns 0 for images with inline style dimensions", () => {
      document.body.innerHTML = `
        <img src="test.jpg" style="width: 100px; height: 100px;" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(0)
    })

    it("returns 0 for images with mixed attribute and style", () => {
      document.body.innerHTML = `
        <img src="test.jpg" width="100" style="height: 100px;" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(0)
    })

    it("counts images missing width", () => {
      document.body.innerHTML = `
        <img src="test.jpg" height="100" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(1)
    })

    it("counts images missing height", () => {
      document.body.innerHTML = `
        <img src="test.jpg" width="100" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(1)
    })

    it("counts images missing both dimensions", () => {
      document.body.innerHTML = `
        <img src="test.jpg" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(1)
    })

    it("returns elements array for highlighting", () => {
      document.body.innerHTML = `
        <img src="test1.jpg" />
        <img src="test2.jpg" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.elements).toBeDefined()
      expect(result?.elements?.length).toBe(2)
    })

    it("does not return elements array when count is 0", () => {
      document.body.innerHTML = `
        <img src="test.jpg" width="100" height="100" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.elements).toBeUndefined()
    })

    it("correctly pluralizes message for single image", () => {
      document.body.innerHTML = `<img src="test.jpg" />`
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.message).toContain("1 image missing")
    })

    it("correctly pluralizes message for multiple images", () => {
      document.body.innerHTML = `
        <img src="test1.jpg" />
        <img src="test2.jpg" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.message).toContain("2 images missing")
    })

    it("handles mixed compliant and non-compliant images", () => {
      document.body.innerHTML = `
        <img src="good.jpg" width="100" height="100" />
        <img src="bad.jpg" />
        <img src="good2.jpg" style="width: 50px; height: 50px;" />
        <img src="bad2.jpg" width="100" />
      `
      const result = imagesWithoutDimensionsCheck.run()
      expect(result?.value).toBe(2)
    })
  })
})

describe("checkImagesWithoutDimensions (legacy)", () => {
  beforeEach(() => {
    document.body.innerHTML = ""
  })

  it("returns null when no images missing dimensions", () => {
    document.body.innerHTML = `
      <img src="test.jpg" width="100" height="100" />
    `
    const issue = checkImagesWithoutDimensions()
    expect(issue).toBeNull()
  })

  it("returns warning for any image without dimensions (anyTriggers)", () => {
    document.body.innerHTML = `<img src="test.jpg" />`
    const issue = checkImagesWithoutDimensions()
    expect(issue).not.toBeNull()
    expect(issue?.severity).toBe("warning")
    expect(issue?.count).toBe(1)
  })

  it("includes elements in issue", () => {
    document.body.innerHTML = `<img src="test.jpg" />`
    const issue = checkImagesWithoutDimensions()
    expect(issue?.elements).toBeDefined()
    expect(issue?.elements?.length).toBe(1)
  })
})
