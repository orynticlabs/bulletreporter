'use client'

import React, { useRef, useImperativeHandle, forwardRef } from 'react'
import dynamic from 'next/dynamic'

// react-quill must be dynamically imported in Next.js (SSR issue)
const ReactQuill = dynamic(() => import('react-quill-new'), {
  ssr: false,
  loading: () => <div className="h-40 bg-gray-100 animate-pulse rounded-lg"></div>,
})

// Import quill CSS only on client
if (typeof window !== 'undefined') {
  require('react-quill-new/dist/quill.snow.css')
}

const QuillWrapper = forwardRef(({ value, onChange, theme = 'snow', placeholder = 'Enter text...' }, ref) => {
  const quillRef = useRef()

  useImperativeHandle(ref, () => ({
    getEditor: () => quillRef.current?.getEditor(),
  }))

  return (
    <ReactQuill
      ref={quillRef}
      value={value}
      onChange={onChange}
      theme={theme}
      placeholder={placeholder}
      modules={{
        toolbar: [
          [{ header: [1, 2, false] }],
          ['bold', 'italic', 'underline', 'strike'],
          [{ list: 'ordered' }, { list: 'bullet' }],
          ['link', 'image'],
          ['clean'],
        ],
      }}
      formats={['header', 'bold', 'italic', 'underline', 'strike', 'list', 'bullet', 'link', 'image']}
      className="bg-background text-foreground"
    />
  )
})

QuillWrapper.displayName = 'QuillWrapper'
export default QuillWrapper
