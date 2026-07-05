'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'

const fieldStyles = {
  actions: {
    display: 'flex',
    gap: 8,
    marginLeft: 'auto',
  },
  button: {
    background: 'transparent',
    border: '1px solid var(--theme-elevation-200)',
    borderRadius: 4,
    color: 'var(--theme-text)',
    cursor: 'pointer',
    fontSize: 12,
    height: 28,
    padding: '0 10px',
  },
  check: {
    accentColor: 'var(--theme-success-500)',
    height: 16,
    width: 16,
  },
  description: {
    color: 'var(--theme-elevation-500)',
    fontSize: 12,
    marginTop: 6,
  },
  empty: {
    color: 'var(--theme-elevation-500)',
    padding: 12,
  },
  error: {
    color: 'var(--theme-error-500)',
    fontSize: 12,
    marginTop: 6,
  },
  dropdown: {
    background: 'var(--theme-bg)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    boxShadow: '0 12px 28px rgba(0, 0, 0, 0.18)',
    left: 0,
    marginTop: 6,
    position: 'absolute',
    right: 0,
    zIndex: 20,
  },
  dropdownButton: {
    alignItems: 'center',
    background: 'var(--theme-input-bg)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    color: 'var(--theme-text)',
    cursor: 'pointer',
    display: 'flex',
    fontSize: 13,
    justifyContent: 'space-between',
    minHeight: 40,
    padding: '0 12px',
    textAlign: 'left',
    width: '100%',
  },
  dropdownButtonDisabled: {
    cursor: 'not-allowed',
    opacity: 0.65,
  },
  dropdownShell: {
    position: 'relative',
  },
  header: {
    alignItems: 'center',
    display: 'flex',
    gap: 12,
    padding: '10px 12px 8px',
  },
  icon: {
    color: 'var(--theme-elevation-600)',
    fontSize: 16,
    lineHeight: 1,
    marginLeft: 12,
  },
  label: {
    color: 'var(--theme-text)',
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  list: {
    maxHeight: 260,
    overflowY: 'auto',
  },
  option: {
    alignItems: 'center',
    borderBottom: '1px solid var(--theme-elevation-100)',
    cursor: 'pointer',
    display: 'flex',
    gap: 10,
    minHeight: 42,
    padding: '9px 12px',
  },
  optionDisabled: {
    cursor: 'not-allowed',
    opacity: 0.65,
  },
  required: {
    color: 'var(--theme-error-500)',
  },
  search: {
    background: 'var(--theme-input-bg)',
    border: '1px solid var(--theme-elevation-150)',
    borderRadius: 4,
    color: 'var(--theme-text)',
    height: 36,
    margin: '0 12px 8px',
    padding: '0 10px',
    width: 'calc(100% - 24px)',
  },
  summary: {
    overflow: 'hidden',
    textOverflow: 'ellipsis',
    whiteSpace: 'nowrap',
  },
  title: {
    color: 'var(--theme-text)',
    fontSize: 13,
    fontWeight: 500,
  },
  wrapper: {
    marginBottom: 24,
  },
}

const getID = (item) => {
  if (item && typeof item === 'object') {
    return item.value ?? item.id
  }

  return item
}

const getCategoryLabel = (category) => {
  return category?.name || category?.nameHindi || category?.slug || `Category ${category?.id}`
}

export const CategoryCheckboxRelationshipField = (props) => {
  const { field, path: pathFromProps, readOnly, validate } = props
  const [categories, setCategories] = useState([])
  const [fetchError, setFetchError] = useState('')
  const [isOpen, setIsOpen] = useState(false)
  const [isLoading, setIsLoading] = useState(true)
  const [query, setQuery] = useState('')
  const dropdownRef = useRef(null)

  const validateCategories = useCallback(
    (incomingValue, validationOptions) => {
      if (field?.required && (!Array.isArray(incomingValue) || incomingValue.length === 0)) {
        return 'Please select at least one category.'
      }

      if (typeof validate === 'function') {
        return validate(incomingValue, { ...validationOptions, required: field?.required })
      }

      return true
    },
    [field?.required, validate],
  )

  const { disabled, errorMessage, path, setValue, showError, value } = useField({
    potentiallyStalePath: pathFromProps,
    validate: validateCategories,
  })

  const selectedIDs = useMemo(() => {
    if (!Array.isArray(value)) {
      return []
    }

    return value.map((item) => String(getID(item)))
  }, [value])

  const selectedIDSet = useMemo(() => new Set(selectedIDs), [selectedIDs])
  const isDisabled = disabled || readOnly

  const selectedSummary = useMemo(() => {
    if (selectedIDs.length === 0) {
      return 'Select categories'
    }

    const selectedLabels = categories
      .filter((category) => selectedIDSet.has(String(category.id)))
      .map(getCategoryLabel)

    if (selectedLabels.length === 0) {
      return `${selectedIDs.length} selected`
    }

    if (selectedLabels.length <= 2) {
      return selectedLabels.join(', ')
    }

    return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2} more`
  }, [categories, selectedIDSet, selectedIDs.length])

  useEffect(() => {
    const controller = new AbortController()
    const categoriesURL = '/api/categories?depth=0&limit=300&sort=order'

    const loadCategories = async () => {
      setIsLoading(true)
      setFetchError('')

      try {
        const response = await fetch(categoriesURL, {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) {
          throw new Error('Unable to load categories.')
        }

        const data = await response.json()
        setCategories(Array.isArray(data?.docs) ? data.docs : [])
      } catch (error) {
        if (error.name !== 'AbortError') {
          setFetchError(error.message || 'Unable to load categories.')
        }
      } finally {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      }
    }

    loadCategories()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!isOpen) {
      return undefined
    }

    const handleDocumentMouseDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) {
        setIsOpen(false)
      }
    }

    const handleDocumentKeyDown = (event) => {
      if (event.key === 'Escape') {
        setIsOpen(false)
      }
    }

    document.addEventListener('mousedown', handleDocumentMouseDown)
    document.addEventListener('keydown', handleDocumentKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleDocumentMouseDown)
      document.removeEventListener('keydown', handleDocumentKeyDown)
    }
  }, [isOpen])

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()

    if (!normalizedQuery) {
      return categories
    }

    return categories.filter((category) => {
      const searchableText = [
        category?.name,
        category?.nameHindi,
        category?.slug,
        category?.id,
      ]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()

      return searchableText.includes(normalizedQuery)
    })
  }, [categories, query])

  const toggleCategory = useCallback(
    (categoryID) => {
      if (isDisabled) {
        return
      }

      const normalizedID = String(categoryID)
      const currentValue = Array.isArray(value) ? value.map(getID) : []
      const isSelected = currentValue.some((item) => String(item) === normalizedID)
      const nextValue = isSelected
        ? currentValue.filter((item) => String(item) !== normalizedID)
        : [...currentValue, categoryID]

      setValue(nextValue)
    },
    [isDisabled, setValue, value],
  )

  const selectAllVisible = useCallback(() => {
    if (isDisabled) {
      return
    }

    const currentValue = Array.isArray(value) ? value.map(getID) : []
    const nextValue = [...currentValue]

    filteredCategories.forEach((category) => {
      if (!nextValue.some((item) => String(item) === String(category.id))) {
        nextValue.push(category.id)
      }
    })

    setValue(nextValue)
  }, [filteredCategories, isDisabled, setValue, value])

  const clearSelection = useCallback(() => {
    if (!isDisabled) {
      setValue([])
    }
  }, [isDisabled, setValue])

  const toggleDropdown = useCallback(() => {
    if (!isDisabled) {
      setIsOpen((currentIsOpen) => !currentIsOpen)
    }
  }, [isDisabled])

  return (
    <div className="field-type relationship" style={fieldStyles.wrapper}>
      <label htmlFor={`${path}-category-toggle`} style={fieldStyles.label}>
        {field?.label || 'Categories'} {field?.required ? <span style={fieldStyles.required}>*</span> : null}
      </label>

      <div ref={dropdownRef} style={fieldStyles.dropdownShell}>
        <button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={isDisabled}
          id={`${path}-category-toggle`}
          onClick={toggleDropdown}
          style={{
            ...fieldStyles.dropdownButton,
            ...(isDisabled ? fieldStyles.dropdownButtonDisabled : {}),
          }}
          type="button"
        >
          <span style={fieldStyles.summary}>{selectedSummary}</span>
          <span aria-hidden="true" style={fieldStyles.icon}>
            {isOpen ? '^' : 'v'}
          </span>
        </button>

        {isOpen ? (
          <div aria-busy={isLoading} style={fieldStyles.dropdown}>
            <div style={fieldStyles.header}>
              <span style={fieldStyles.title}>{selectedIDs.length} selected</span>
              <div style={fieldStyles.actions}>
                <button disabled={isDisabled || filteredCategories.length === 0} onClick={selectAllVisible} style={fieldStyles.button} type="button">
                  Select all
                </button>
                <button disabled={isDisabled || selectedIDs.length === 0} onClick={clearSelection} style={fieldStyles.button} type="button">
                  Clear
                </button>
              </div>
            </div>

            <input
              disabled={isDisabled}
              id={`${path}-category-search`}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories"
              style={fieldStyles.search}
              type="search"
              value={query}
            />

            <div style={fieldStyles.list}>
              {isLoading ? <div style={fieldStyles.empty}>Loading categories...</div> : null}
              {!isLoading && fetchError ? <div style={fieldStyles.empty}>{fetchError}</div> : null}
              {!isLoading && !fetchError && filteredCategories.length === 0 ? (
                <div style={fieldStyles.empty}>No categories found.</div>
              ) : null}
              {!isLoading && !fetchError
                ? filteredCategories.map((category, index) => {
                    const checked = selectedIDSet.has(String(category.id))

                    return (
                      <label
                        key={category.id}
                        style={{
                          ...fieldStyles.option,
                          ...(isDisabled ? fieldStyles.optionDisabled : {}),
                          borderBottom:
                            index === filteredCategories.length - 1 ? '0' : fieldStyles.option.borderBottom,
                        }}
                      >
                        <input
                          checked={checked}
                          disabled={isDisabled}
                          onChange={() => toggleCategory(category.id)}
                          style={fieldStyles.check}
                          type="checkbox"
                        />
                        <span>{getCategoryLabel(category)}</span>
                      </label>
                    )
                  })
                : null}
            </div>
          </div>
        ) : null}
      </div>

      {field?.admin?.description ? (
        <div style={fieldStyles.description}>{field.admin.description}</div>
      ) : null}
      {showError ? (
        <div style={fieldStyles.error}>{errorMessage || 'Please select at least one category.'}</div>
      ) : null}
    </div>
  )
}

export default CategoryCheckboxRelationshipField
