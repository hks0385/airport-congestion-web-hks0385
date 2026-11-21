import {
  CartesianGrid,
  Legend,
  Line,
  LineChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts'

type PassengerForecastItem = Record<string, string | number>

interface PassengerForecastChartProps {
  items: PassengerForecastItem[]
}

const chartGroups = [
  {
    title: '제1여객터미널 · 입국',
    series: [
      { key: 't1eg1', name: '입국장 동편 (A·B)', color: '#2563eb' },
      { key: 't1eg2', name: '입국장 서편 (E·F)', color: '#7c3aed' },
      { key: 't1eg3', name: '입국심사 (C)', color: '#0891b2' },
      { key: 't1eg4', name: '입국심사 (D)', color: '#ea580c' },
    ],
  },
  {
    title: '제1여객터미널 · 출국',
    series: [
      { key: 't1dg1', name: '출국장 1', color: '#2563eb' },
      { key: 't1dg2', name: '출국장 2', color: '#7c3aed' },
      { key: 't1dg3', name: '출국장 3', color: '#0891b2' },
      { key: 't1dg4', name: '출국장 4', color: '#ea580c' },
      { key: 't1dg5', name: '출국장 5', color: '#16a34a' },
      { key: 't1dg6', name: '출국장 6', color: '#db2777' },
    ],
  },
  {
    title: '제2여객터미널 · 입국',
    series: [
      { key: 't2eg1', name: '입국장 1', color: '#0891b2' },
      { key: 't2eg2', name: '입국장 2', color: '#ea580c' },
    ],
  },
  {
    title: '제2여객터미널 · 출국',
    series: [
      { key: 't2dg1', name: '출국장 1', color: '#16a34a' },
      { key: 't2dg2', name: '출국장 2', color: '#db2777' },
    ],
  },
] as const

function PassengerForecastChart({ items }: PassengerForecastChartProps) {
  return (
    <section className="chart-card" aria-labelledby="forecast-chart-title">
      <div className="chart-heading">
        <div>
          <p className="eyebrow">PASSENGER FORECAST</p>
          <h2 id="forecast-chart-title">시간대별 구역별 예상 승객 수</h2>
        </div>
        <p>합계 제외 · 각 구역별 예상 인원</p>
      </div>

      <div className="chart-grid">
        {chartGroups.map(({ title, series }) => {
          const chartData = items.map((item) => ({
            time: String(item.atime ?? '').replace('_', ' ~ '),
            ...Object.fromEntries(
              series.map(({ key }) => {
                const value = item[key]
                const number = value === '' || value === undefined ? 0 : Number(value)
                return [key, Number.isFinite(number) ? number : 0]
              }),
            ),
          }))

          return (
            <section className="chart-panel" key={title} aria-label={title}>
              <h3>{title}</h3>
              <div className="chart-container">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart
                    data={chartData}
                    margin={{ top: 8, right: 12, bottom: 8, left: 4 }}
                  >
                    <CartesianGrid stroke="var(--border)" strokeDasharray="3 3" />
                    <XAxis
                      dataKey="time"
                      tick={{ fill: 'var(--text)', fontSize: 11 }}
                      minTickGap={24}
                    />
                    <YAxis
                      width={58}
                      tick={{ fill: 'var(--text)', fontSize: 11 }}
                      tickFormatter={(value: number) => value.toLocaleString('ko-KR')}
                    />
                    <Tooltip
                      formatter={(value) => [
                        `${Number(value).toLocaleString('ko-KR')}명`,
                      ]}
                      labelFormatter={(label) => `시간대 ${label}`}
                      contentStyle={{
                        borderRadius: 10,
                        borderColor: 'var(--border)',
                        background: 'var(--bg)',
                      }}
                    />
                    <Legend />
                    {series.map(({ key, name, color }) => (
                      <Line
                        key={key}
                        type="monotone"
                        dataKey={key}
                        name={name}
                        stroke={color}
                        strokeWidth={2}
                        dot={false}
                        activeDot={{ r: 4 }}
                      />
                    ))}
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </section>
          )
        })}
      </div>
    </section>
  )
}

export default PassengerForecastChart
