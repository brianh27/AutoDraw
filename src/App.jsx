import { useRef, useEffect, useState } from 'react'
import './App.css'
import { createClient } from '@supabase/supabase-js'

function App() {
  const canvasRef = useRef(null)
  const [isDrawing, setIsDrawing] = useState(false)
  const [lastPos, setLastPos] = useState({ x: 0, y: 0 })
  const [isSubmitting, setIsSubmitting] = useState(false)
  const [drawing, setDrawing] = useState([])
  async function uploadFile(file) {
    const url="https://sxtzgmtyspvzksxqpefj.supabase.co"
    const api="eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InN4dHpnbXR5c3B2emtzeHFwZWZqIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NTQ1MzMwNTgsImV4cCI6MjA3MDEwOTA1OH0.5QW1nGj4wUdsF0hQKezbe5aFPGXqS-Cw_5AVgfZgp10"
    const supabase = createClient(url, api)
    
    try {
      // Send the drawing data directly as multidimensional array
      const { data, error } = await supabase
        .from('drawings')
        .insert([
          { data: file },
        ])
        .select()
      
      if (error) {
        console.error('Supabase error:', error)
      } else {
        console.log('Successfully uploaded drawing:', data)
      }
    } catch (err) {
      console.error('Upload failed:', err)
    }
  }
  useEffect(() => {
    const canvas = canvasRef.current
    if (canvas) {
      const ctx = canvas.getContext('2d')
      ctx.lineCap = 'round'
      ctx.lineJoin = 'round'
      ctx.lineWidth = 2
      ctx.strokeStyle = '#000000'
      
      // Fill canvas with white background
      ctx.fillStyle = '#ffffff'
      ctx.fillRect(0, 0, canvas.width, canvas.height)
    }
  }, [])

  const startDrawing = (e) => {
    const canvas = canvasRef.current
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    setIsDrawing(true)
    setLastPos({ x, y })
    
    // Start a new stroke in the drawing array
    setDrawing(prev => [...prev, [[x, y]]])
  }

  const draw = (e) => {
    if (!isDrawing) return
    
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    const rect = canvas.getBoundingClientRect()
    const x = e.clientX - rect.left
    const y = e.clientY - rect.top
    
    ctx.beginPath()
    ctx.moveTo(lastPos.x, lastPos.y)
    ctx.lineTo(x, y)
    ctx.stroke()
    
    setLastPos({ x, y })
    
    // Add current point to the current stroke
    setDrawing(prev => {
      const newDrawing = [...prev]
      if (newDrawing.length > 0) {
        const currentStroke = [...newDrawing[newDrawing.length - 1]]
        currentStroke.push([x, y])
        newDrawing[newDrawing.length - 1] = currentStroke
      }
      return newDrawing
    })
  }

  const stopDrawing = () => {
    setIsDrawing(false)
  }

  const stopDrawingAndFinalize = () => {
    setIsDrawing(false)
    // This function is called when mouse leaves canvas - same as lifting pen
  }

  const clearCanvas = () => {
    const canvas = canvasRef.current
    const ctx = canvas.getContext('2d')
    ctx.fillStyle = '#ffffff'
    ctx.fillRect(0, 0, canvas.width, canvas.height)
    
    // Clear the drawing data
    setDrawing([])
  }

  const submitDrawing = async () => {
    if (isSubmitting) return // Prevent multiple submissions
    
    setIsSubmitting(true)
    const canvas = canvasRef.current
    const dataURL = canvas.toDataURL('image/png')
    
    // Create a download link
    const link = document.createElement('a')
    link.download = `drawing-${new Date().getTime()}.png`
    link.href = dataURL
    link.click()
    
    // Upload to Supabase
    console.log('Drawing data:', drawing)
    await uploadFile(drawing)
    
    alert('🎨 Drawing saved successfully!')
    
    // Re-enable the button after a short delay
    setTimeout(() => {
      setIsSubmitting(false)
    }, 2000)
  }

  return (
    <div className="min-h-screen bg-blue-200 flex items-center justify-center p-8">
      <div className="bg-white rounded-2xl shadow-2xl p-8 max-w-md mx-auto">
        <div className="text-center mb-6">
          <h1 className="text-3xl font-bold text-gray-800 mb-2">
            ✨ Simple Draw ✨
          </h1>
          <p className="text-gray-600">
            Click and drag to draw on the canvas
          </p>
        </div>
        
        <div className="flex justify-center mb-4">
          <div className="border-4 border-gray-300 rounded-lg shadow-inner">
            <canvas
              ref={canvasRef}
              width={220}
              height={220}
              className="block cursor-crosshair rounded"
              onMouseDown={startDrawing}
              onMouseMove={draw}
              onMouseUp={stopDrawing}
              onMouseLeave={stopDrawingAndFinalize}
            />
          </div>
        </div>
        
        <div className="text-center space-y-3">
          <button
            onClick={submitDrawing}
            disabled={isSubmitting}
            className={`font-semibold py-2 px-6 rounded-full transition-all duration-200 transform shadow-lg mr-3 ${
              isSubmitting 
                ? 'bg-gray-400 cursor-not-allowed opacity-75' 
                : 'bg-gradient-to-r from-green-500 to-emerald-600 hover:from-green-600 hover:to-emerald-700 hover:scale-105 cursor-pointer'
            } text-white`}
          >
            {isSubmitting ? '⏳ Submitting...' : '💾 Submit Drawing'}
          </button>
          
          <button
            onClick={clearCanvas}
            className="bg-gradient-to-r from-blue-500 to-purple-600 hover:from-blue-600 hover:to-purple-700 text-white font-semibold py-2 px-6 rounded-full transition-all duration-200 transform hover:scale-105 shadow-lg"
          >
            🗑️ Clear Canvas
          </button>
        </div>
        
        <div className="mt-6 text-center">
          <div className="inline-flex items-center bg-gray-100 rounded-full px-4 py-2">
            <div className="w-3 h-3 bg-black rounded-full mr-2"></div>
            <span className="text-sm text-gray-600">Drawing with black ink</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default App
