import "./style.css"

function Popup() {
  return (
    <div className="w-80 p-4 bg-white">
      <h1 className="text-xl font-bold text-gray-900">BubbleBoost</h1>
      <p className="text-sm text-gray-600 mt-2">
        Performance analyzer for Bubble.io
      </p>
      <div className="mt-4 p-3 bg-gray-50 rounded-lg">
        <p className="text-sm text-gray-500">
          Open a Bubble.io editor page to start analyzing.
        </p>
      </div>
    </div>
  )
}

export default Popup
