import { useEffect, useState } from 'react'
import './App.css'
import PassengerForecastChart from './PassengerForecastChart'

export const API_BASE_URL = import.meta.env.VITE_BASE_URL
export const API_KEY = import.meta.env.VITE_API_KEY

type PassengerForecastItem = Record<string, string | number>

interface PassengerForecastResponse {
  response: {
    header: {
      resultCode: string
      resultMsg: string
    }
    body: {
      items: PassengerForecastItem[]
      numOfRows: number
      pageNo: number
      totalCount: number
    }
  }
}

const metricGroups = [
  {
    title: '제1여객터미널 · 입국',
    fields: [
      ['t1eg1', '입국장 동편 (A·B)'],
      ['t1eg2', '입국장 서편 (E·F)'],
      ['t1eg3', '입국심사 (C)'],
      ['t1eg4', '입국심사 (D)'],
      ['t1egsum1', '입국장 합계'],
    ],
  },
  {
    title: '제1여객터미널 · 출국',
    fields: [
      ['t1dg1', '출국장 1'],
      ['t1dg2', '출국장 2'],
      ['t1dg3', '출국장 3'],
      ['t1dg4', '출국장 4'],
      ['t1dg5', '출국장 5'],
      ['t1dg6', '출국장 6'],
      ['t1dgsum1', '출국장 합계'],
    ],
  },
  {
    title: '제2여객터미널 · 입국',
    fields: [
      ['t2eg1', '입국장 1'],
      ['t2eg2', '입국장 2'],
      ['t2egsum1', '입국장 합계'],
    ],
  },
  {
    title: '제2여객터미널 · 출국',
    fields: [
      ['t2dg1', '출국장 1'],
      ['t2dg2', '출국장 2'],
      ['t2dgsum2', '출국장 합계'],
    ],
  },
] as const

const knownMetricFields = new Set<string>(
  metricGroups.flatMap((group) => group.fields.map(([key]) => key)),
)

const summaryMetrics = [
  ['t1egsum1', 'T1 입국'],
  ['t1dgsum1', 'T1 출국'],
  ['t2egsum1', 'T2 입국'],
  ['t2dgsum2', 'T2 출국'],
] as const

function formatPassengerCount(value: string | number | undefined): string {
  if (value === undefined || value === '') {
    return '-'
  }

  const number = Number(value)
  return Number.isFinite(number)
    ? `${number.toLocaleString('ko-KR')}명`
    : String(value)
}

async function fetchCongestionData(
  selectdate: '0' | '1' = '0',
  signal?: AbortSignal,
): Promise<PassengerForecastResponse> {
  if (!API_BASE_URL || !API_KEY) {
    throw new Error('VITE_BASE_URL and VITE_API_KEY must be configured.')
  }

  const url = new URL(
    'getPassgrAnncmt',
    `${API_BASE_URL.replace(/\/+$/, '')}/`,
  )
  url.search = new URLSearchParams({
    selectdate,
    type: 'json',
    serviceKey: API_KEY,
    numOfRows: '1000',
    pageNo: '1',
  }).toString()

  const response = await fetch(url, { signal })
  if (!response.ok) {
    throw new Error(`Passenger forecast request failed: ${response.status}`)
  }

  const data = (await response.json()) as PassengerForecastResponse
  if (data.response.header.resultCode !== '00') {
    throw new Error(
      `Passenger forecast API error: ${data.response.header.resultMsg}`,
    )
  }

  return data
}

function App() {
  const [items, setItems] = useState<PassengerForecastItem[]>([])
  const [isLoading, setIsLoading] = useState(true)
  const [errorMessage, setErrorMessage] = useState('')

  useEffect(() => {
    const controller = new AbortController()

    void fetchCongestionData('0', controller.signal)
      .then((data) => {
        setItems(data.response.body.items)
        console.log('인천공항 승객 예고 데이터:', data.response.body.items)
      })
      .catch((error: unknown) => {
        if (!controller.signal.aborted) {
          console.error('인천공항 승객 예고 데이터를 가져오지 못했습니다:', error)
          setErrorMessage('혼잡도 데이터를 불러오지 못했습니다. 잠시 후 다시 시도해 주세요.')
        }
      })
      .finally(() => {
        if (!controller.signal.aborted) {
          setIsLoading(false)
        }
      })

    return () => controller.abort()
  }, [])

  return (
    <main className="forecast-page">
      <header className="forecast-header">
        <p className="eyebrow">INCHEON AIRPORT · PASSENGER FORECAST</p>
        <h1>공항 혼잡도 예고</h1>
        <p className="forecast-description">
          시간대별 터미널 출입국 예상 승객 수를 확인하세요.
        </p>
      </header>

      {isLoading && <p className="request-state">혼잡도 데이터를 불러오는 중입니다...</p>}
      {errorMessage && <p className="request-state error-state" role="alert">{errorMessage}</p>}
      {!isLoading && !errorMessage && items.length === 0 && (
        <p className="request-state">표시할 예측 데이터가 없습니다.</p>
      )}

      {items.length > 0 && <PassengerForecastChart items={items} />}

      <section className="forecast-list" aria-label="시간대별 승객 예측">
        {items.map((item, index) => {
          const date = String(item.adate ?? '')
          const formattedDate = date.length === 8
            ? `${date.slice(0, 4)}.${date.slice(4, 6)}.${date.slice(6, 8)}`
            : date
          const extraFields = Object.entries(item).filter(
            ([key]) => key !== 'adate' && key !== 'atime' && !knownMetricFields.has(key),
          )

          return (
            <details className="forecast-card" key={`${date}-${item.atime}-${index}`}>
              <summary className="forecast-summary">
                <div className="time-heading">
                  <div>
                    <p className="forecast-date">{formattedDate}</p>
                    <h2>{String(item.atime ?? '시간 미정').replace('_', ' ~ ')}</h2>
                  </div>
                  <span className="expand-label">상세 보기</span>
                </div>
                <div className="summary-metrics">
                  {summaryMetrics.map(([key, label]) => (
                    <div className="summary-metric" key={key}>
                      <span>{label}</span>
                      <strong>{formatPassengerCount(item[key])}</strong>
                    </div>
                  ))}
                </div>
              </summary>

              <div className="forecast-details">
                <div className="terminal-grid">
                  {metricGroups.map((group) => (
                    <section className="terminal-panel" key={group.title}>
                      <h3>{group.title}</h3>
                      <dl className="metric-list">
                        {group.fields.map(([key, label]) => (
                          <div className="metric-row" key={key}>
                            <dt>{label}</dt>
                            <dd>{formatPassengerCount(item[key])}</dd>
                          </div>
                        ))}
                      </dl>
                    </section>
                  ))}
                </div>
                {extraFields.length > 0 && (
                  <section className="terminal-panel extra-panel">
                    <h3>기타 항목</h3>
                    <dl className="metric-list">
                      {extraFields.map(([key, value]) => (
                        <div className="metric-row" key={key}>
                          <dt>{key}</dt>
                          <dd>{value === '' ? '-' : String(value)}</dd>
                        </div>
                      ))}
                    </dl>
                  </section>
                )}
              </div>
            </details>
          )
        })}
      </section>
    </main>
  )
}

export default App
