import { useState, useEffect, useMemo, useCallback } from 'react'
import { Table, Input, Button, Space, ConfigProvider, theme } from 'antd'
import type { ColumnsType } from 'antd/es/table'
import type { Key } from 'react'

interface RegionData {
  atlases: string[]
  atlasKeys: string[]
  totalRegions: number
  regions: RegionNode[]
}

interface RegionNode {
  key: string
  id: number
  name: string
  children?: RegionNode[]
  [key: string]: unknown
}

function App() {
  const [data, setData] = useState<RegionNode[]>([])
  const [atlases, setAtlases] = useState<string[]>([])
  const [atlasKeys, setAtlasKeys] = useState<string[]>([])
  const [totalRegions, setTotalRegions] = useState(0)
  const [searchText, setSearchText] = useState('')
  const [expandedKeys, setExpandedKeys] = useState<readonly Key[]>([])
  const [loading, setLoading] = useState(true)

  // Load data
  useEffect(() => {
    fetch('/regions.json')
      .then(res => res.json())
      .then((result: RegionData) => {
        setData(result.regions)
        setAtlases(result.atlases)
        setAtlasKeys(result.atlasKeys)
        setTotalRegions(result.totalRegions)
        setLoading(false)
      })
      .catch(err => {
        console.error('Failed to load regions:', err)
        setLoading(false)
      })
  }, [])

  // Column definitions
  const columns = useMemo<ColumnsType<RegionNode>>(() => {
    const cols: ColumnsType<RegionNode> = [
      {
        title: 'Region Name',
        dataIndex: 'name',
        key: 'name',
        width: 350,
        fixed: 'left',
      }
    ]

    // Add a column for each atlas
    atlasKeys.forEach((key, index) => {
      cols.push({
        title: atlases[index] || key,
        dataIndex: key,
        key: key,
        width: 180,
        align: 'center',
        render: (value: string | null) => {
          if (!value) {
            return <span style={{ color: '#ccc' }}>—</span>
          }
          return <span style={{ fontFamily: 'monospace', fontWeight: 500 }}>{value}</span>
        }
      })
    })

    return cols
  }, [atlases, atlasKeys])

  // Collect all keys from tree
  const getAllKeys = useCallback((nodes: RegionNode[]): string[] => {
    const keys: string[] = []
    const traverse = (items: RegionNode[]) => {
      for (const item of items) {
        keys.push(item.key)
        if (item.children) {
          traverse(item.children)
        }
      }
    }
    traverse(nodes)
    return keys
  }, [])

  // Expand all
  const expandAll = useCallback(() => {
    const allKeys = getAllKeys(data)
    setExpandedKeys(allKeys)
  }, [data, getAllKeys])

  // Collapse all
  const collapseAll = useCallback(() => {
    setExpandedKeys([])
  }, [])

  // Filter data based on search
  const filteredData = useMemo(() => {
    if (!searchText.trim()) {
      return data
    }

    const searchLower = searchText.toLowerCase()

    const filterTree = (nodes: RegionNode[]): RegionNode[] => {
      const result: RegionNode[] = []

      for (const node of nodes) {
        // Check if this node matches
        const nameMatch = node.name.toLowerCase().includes(searchLower)
        const acronymMatch = atlasKeys.some(key => {
          const val = node[key]
          return typeof val === 'string' && val.toLowerCase().includes(searchLower)
        })

        // Check if any children match
        let filteredChildren: RegionNode[] | undefined
        if (node.children) {
          filteredChildren = filterTree(node.children)
        }

        // Include node if it matches or has matching children
        if (nameMatch || acronymMatch || (filteredChildren && filteredChildren.length > 0)) {
          result.push({
            ...node,
            children: filteredChildren && filteredChildren.length > 0 ? filteredChildren : undefined
          })
        }
      }

      return result
    }

    return filterTree(data)
  }, [data, searchText, atlasKeys])

  // Auto-expand when searching
  useEffect(() => {
    if (searchText.trim()) {
      const allKeys = getAllKeys(filteredData)
      setExpandedKeys(allKeys)
    }
  }, [searchText, filteredData, getAllKeys])

  // Handle expand/collapse
  const onExpand = useCallback((expanded: boolean, record: RegionNode) => {
    if (expanded) {
      setExpandedKeys(prev => [...prev, record.key])
    } else {
      setExpandedKeys(prev => prev.filter(k => k !== record.key))
    }
  }, [])

  return (
    <ConfigProvider
      theme={{
        algorithm: theme.defaultAlgorithm,
        token: {
          colorPrimary: '#667eea',
        },
      }}
    >
      <div className="app">
        <header className="header">
          <h1>Multi-Atlas Brain Region Comparison</h1>
          <p className="stats">
            {totalRegions} unique regions | {atlases.length} atlases
          </p>
        </header>

        <div className="controls">
          <Input.Search
            placeholder="Search by region name or acronym..."
            value={searchText}
            onChange={(e) => setSearchText(e.target.value)}
            allowClear
            style={{ width: 350 }}
            size="large"
          />
          <Space>
            <Button type="primary" onClick={expandAll}>
              Expand All
            </Button>
            <Button onClick={collapseAll}>
              Collapse All
            </Button>
          </Space>
          {searchText && (
            <span className="match-count">
              {getAllKeys(filteredData).length} matches
            </span>
          )}
        </div>

        <div className="table-container">
          <Table
            columns={columns}
            dataSource={filteredData}
            loading={loading}
            expandable={{
              expandedRowKeys: expandedKeys as Key[],
              onExpand: onExpand,
              indentSize: 24,
            }}
            pagination={false}
            scroll={{ x: 'max-content', y: 'calc(100vh - 220px)' }}
            size="small"
            rowClassName={(record) => {
              if (searchText && record.name.toLowerCase().includes(searchText.toLowerCase())) {
                return 'highlight-row'
              }
              return ''
            }}
          />
        </div>
      </div>
    </ConfigProvider>
  )
}

export default App
