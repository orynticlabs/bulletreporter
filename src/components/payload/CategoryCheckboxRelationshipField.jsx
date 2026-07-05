'use client'

import React, { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useField } from '@payloadcms/ui'

const styles = {
  actions: { display: 'flex', gap: 8, marginLeft: 'auto' },
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
  check: { accentColor: 'var(--theme-success-500)', height: 16, width: 16 },
  description: { color: 'var(--theme-elevation-500)', fontSize: 12, marginTop: 6 },
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
  disabled: { cursor: 'not-allowed', opacity: 0.65 },
  empty: { color: 'var(--theme-elevation-500)', padding: 12 },
  error: { color: 'var(--theme-error-500)', fontSize: 12, marginTop: 6 },
  header: { alignItems: 'center', display: 'flex', gap: 12, padding: '10px 12px 8px' },
  icon: { color: 'var(--theme-elevation-600)', fontSize: 16, lineHeight: 1, marginLeft: 12 },
  label: {
    color: 'var(--theme-text)',
    display: 'block',
    fontSize: 13,
    fontWeight: 600,
    marginBottom: 8,
  },
  list: { maxHeight: 260, overflowY: 'auto' },
  option: {
    alignItems: 'center',
    borderBottom: '1px solid var(--theme-elevation-100)',
    cursor: 'pointer',
    display: 'flex',
    gap: 10,
    minHeight: 42,
    padding: '9px 12px',
  },
  required: { color: 'var(--theme-error-500)' },
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
  shell: { position: 'relative' },
  summary: { overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' },
  title: { color: 'var(--theme-text)', fontSize: 13, fontWeight: 500 },
  wrapper: { marginBottom: 24 },
}

const getID = (item) => {
  if (item && typeof item === 'object') return item.value ?? item.id
  return item
}

const getCategoryLabel = (category) => {
  return category?.name || category?.nameHindi || category?.slug || `Category ${category?.id}`
}

const CategoryCheckboxRelationshipFieldInner = (props) => {
  const { field, path: pathFromProps, readOnly, validate } = props
  const [categories, setCategories] = useState([])
  const [fetchError, setFetchError] = useState('')
  const [isLoading, setIsLoading] = useState(true)
  const [isOpen, setIsOpen] = useState(false)
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
    return Array.isArray(value) ? value.map((item) => String(getID(item))) : []
  }, [value])

  const selectedIDSet = useMemo(() => new Set(selectedIDs), [selectedIDs])
  const isDisabled = disabled || readOnly

  useEffect(() => {
    const controller = new AbortController()

    const loadCategories = async () => {
      setIsLoading(true)
      setFetchError('')

      try {
        const response = await fetch('/api/categories?depth=0&limit=300&sort=order', {
          credentials: 'include',
          signal: controller.signal,
        })

        if (!response.ok) throw new Error('Unable to load categories.')

        const data = await response.json()
        setCategories(Array.isArray(data?.docs) ? data.docs : [])
      } catch (error) {
        if (error.name !== 'AbortError') {
          setFetchError(error.message || 'Unable to load categories.')
        }
      } finally {
        if (!controller.signal.aborted) setIsLoading(false)
      }
    }

    loadCategories()

    return () => controller.abort()
  }, [])

  useEffect(() => {
    if (!isOpen) return undefined

    const handleMouseDown = (event) => {
      if (!dropdownRef.current?.contains(event.target)) setIsOpen(false)
    }
    const handleKeyDown = (event) => {
      if (event.key === 'Escape') setIsOpen(false)
    }

    document.addEventListener('mousedown', handleMouseDown)
    document.addEventListener('keydown', handleKeyDown)

    return () => {
      document.removeEventListener('mousedown', handleMouseDown)
      document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen])

  const filteredCategories = useMemo(() => {
    const normalizedQuery = query.trim().toLowerCase()
    if (!normalizedQuery) return categories

    return categories.filter((category) => {
      return [category?.name, category?.nameHindi, category?.slug, category?.id]
        .filter(Boolean)
        .join(' ')
        .toLowerCase()
        .includes(normalizedQuery)
    })
  }, [categories, query])

  const selectedSummary = useMemo(() => {
    if (selectedIDs.length === 0) return 'Select categories'

    const selectedLabels = categories
      .filter((category) => selectedIDSet.has(String(category.id)))
      .map(getCategoryLabel)

    if (selectedLabels.length === 0) return `${selectedIDs.length} selected`
    if (selectedLabels.length <= 2) return selectedLabels.join(', ')

    return `${selectedLabels.slice(0, 2).join(', ')} +${selectedLabels.length - 2} more`
  }, [categories, selectedIDSet, selectedIDs.length])

  const toggleCategory = useCallback(
    (categoryID) => {
      if (isDisabled) return

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
    if (isDisabled) return

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
    if (!isDisabled) setValue([])
  }, [isDisabled, setValue])

  return (
    <div className="field-type relationship" style={styles.wrapper}>
      <label htmlFor={`${path}-category-toggle`} style={styles.label}>
        {field?.label || 'Categories'} {field?.required ? <span style={styles.required}>*</span> : null}
      </label>

      <div ref={dropdownRef} style={styles.shell}>
        <button
          aria-expanded={isOpen}
          aria-haspopup="listbox"
          disabled={isDisabled}
          id={`${path}-category-toggle`}
          onClick={() => !isDisabled && setIsOpen((open) => !open)}
          style={{ ...styles.dropdownButton, ...(isDisabled ? styles.disabled : {}) }}
          type="button"
        >
          <span style={styles.summary}>{selectedSummary}</span>
          <span aria-hidden="true" style={styles.icon}>{isOpen ? '^' : 'v'}</span>
        </button>

        {isOpen ? (
          <div aria-busy={isLoading} style={styles.dropdown}>
            <div style={styles.header}>
              <span style={styles.title}>{selectedIDs.length} selected</span>
              <div style={styles.actions}>
                <button disabled={isDisabled || filteredCategories.length === 0} onClick={selectAllVisible} style={styles.button} type="button">
                  Select all
                </button>
                <button disabled={isDisabled || selectedIDs.length === 0} onClick={clearSelection} style={styles.button} type="button">
                  Clear
                </button>
              </div>
            </div>

            <input
              disabled={isDisabled}
              onChange={(event) => setQuery(event.target.value)}
              placeholder="Search categories"
              style={styles.search}
              type="search"
              value={query}
            />

            <div role="listbox" style={styles.list}>
              {isLoading ? <div style={styles.empty}>Loading categories...</div> : null}
              {!isLoading && fetchError ? <div style={styles.empty}>{fetchError}</div> : null}
              {!isLoading && !fetchError && filteredCategories.length === 0 ? (
                <div style={styles.empty}>No categories found.</div>
              ) : null}
              {!isLoading && !fetchError
                ? filteredCategories.map((category, index) => {
                    const checked = selectedIDSet.has(String(category.id))

                    return (
                      <label
                        key={category.id}
                        style={{
                          ...styles.option,
                          ...(isDisabled ? styles.disabled : {}),
                          borderBottom:
                            index === filteredCategories.length - 1 ? '0' : styles.option.borderBottom,
                        }}
                      >
                        <input
                          checked={checked}
                          disabled={isDisabled}
                          onChange={() => toggleCategory(category.id)}
                          style={styles.check}
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

      {field?.admin?.description ? <div style={styles.description}>{field.admin.description}</div> : null}
      {showError ? <div style={styles.error}>{errorMessage || 'Please select at least one category.'}</div> : null}
    </div>
  )
}

export const CategoryCheckboxRelationshipField = (props) => {
  const [hasMounted, setHasMounted] = useState(false)

  useEffect(() => {
    setHasMounted(true)
  }, [])

  if (!hasMounted) {
    return (
      <div className="field-type relationship" style={styles.wrapper}>
        <label style={styles.label}>
          {props?.field?.label || 'Categories'} {props?.field?.required ? <span style={styles.required}>*</span> : null}
        </label>
        <button disabled style={{ ...styles.dropdownButton, ...styles.disabled }} type="button">
          <span style={styles.summary}>Loading categories...</span>
          <span aria-hidden="true" style={styles.icon}>v</span>
        </button>
      </div>
    )
  }

  return <CategoryCheckboxRelationshipFieldInner {...props} />
}

export default CategoryCheckboxRelationshipField
