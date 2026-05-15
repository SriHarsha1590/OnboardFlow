import { useState, useEffect, useCallback, useRef } from 'react'
import { employeeApi, managerApi } from '../api/client'

export function useEmployees(params = {}) {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    try {
      setLoading(true)
      const res = await employeeApi.list(params)
      setData(res.data || [])
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [JSON.stringify(params)])

  useEffect(() => { fetch() }, [fetch])

  // Auto-refresh every 5s if any workflow is running
  const intervalRef = useRef(null)
  useEffect(() => {
    intervalRef.current = setInterval(() => {
      const hasActive = data.some(e => e.workflow_status === 'RUNNING' || e.workflow_status === 'WAITING_SIGNAL')
      if (hasActive || data.length === 0) fetch()
    }, 5000)
    return () => clearInterval(intervalRef.current)
  }, [data, fetch])

  return { data, loading, error, refetch: fetch }
}

export function useEmployee(id) {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  const fetch = useCallback(async () => {
    if (!id) return
    try {
      setLoading(true)
      const res = await employeeApi.get(id)
      setData(res.data)
      setError(null)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }, [id])

  useEffect(() => { fetch() }, [fetch])

  useEffect(() => {
    const interval = setInterval(() => {
      if (data?.workflow_status === 'RUNNING' || data?.workflow_status === 'WAITING_SIGNAL') fetch()
    }, 3000)
    return () => clearInterval(interval)
  }, [data, fetch])

  return { data, loading, error, refetch: fetch }
}

export function useStats() {
  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(true)

  const fetch = useCallback(async () => {
    try {
      const res = await employeeApi.stats()
      setData(res.data)
    } catch {
      // silent
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { fetch() }, [fetch])
  useEffect(() => {
    const interval = setInterval(fetch, 5000)
    return () => clearInterval(interval)
  }, [fetch])

  return { data, loading, refetch: fetch }
}

export function useManagers() {
  const [data, setData] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    managerApi.list().then(res => setData(res.data || [])).catch(() => {}).finally(() => setLoading(false))
  }, [])

  return { data, loading }
}
