import { useEffect, useState } from "react"
import axios from "axios"

function App() {
  const [data, setData] = useState([])
  const [filteredData, setFilteredData] = useState([])
  const [selectedDistrict, setSelectedDistrict] = useState("전체")
  const [selectedStatus, setSelectedStatus] = useState("전체")
  const [sortOrder, setSortOrder] = useState("none")
  const [unit, setUnit] = useState("㎡")
  const [selectedType, setSelectedType] = useState("전체")
  const [budget, setBudget] = useState("")
  const [loan, setLoan] = useState("")
  const [interestRate, setInterestRate] = useState("")
  const [loanPeriod, setLoanPeriod] = useState("")
  const [repayType, setRepayType] = useState("원리금균등")
  const [monthlyPayment, setMonthlyPayment] = useState(null)
  const [schedule, setSchedule] = useState([])
  const [externalLinks, setExternalLinks] = useState({})
  const [favorites, setFavorites] = useState({})

  const calculateLoan = () => {
    if (!loan || !interestRate || !loanPeriod) {
      alert("대출금액, 이자율, 기간을 모두 입력해주세요.")
      return
    }

    const principal = Number(loan) * 100000000
    const monthlyRate = Number(interestRate) / 100 / 12
    const months = Number(loanPeriod) * 12

    let remaining = principal
    let monthly = 0
    let newSchedule = []

    if (repayType === "원리금균등") {
      monthly =
        (principal * monthlyRate * Math.pow(1 + monthlyRate, months)) /
        (Math.pow(1 + monthlyRate, months) - 1)

      for (let i = 1; i <= months; i++) {
        const interest = remaining * monthlyRate
        const principalPayment = monthly - interest
        remaining -= principalPayment

        newSchedule.push({
          month: i,
          payment: monthly,
          principal: principalPayment,
          interest: interest,
          balance: remaining > 0 ? remaining : 0,
        })
      }
    } else if (repayType === "원금균등") {
      const principalPayment = principal / months

      for (let i = 1; i <= months; i++) {
        const interest = remaining * monthlyRate
        const payment = principalPayment + interest
        remaining -= principalPayment

        newSchedule.push({
          month: i,
          payment: payment,
          principal: principalPayment,
          interest: interest,
          balance: remaining > 0 ? remaining : 0,
        })
      }

      monthly = newSchedule[0].payment
    } else if (repayType === "만기일시상환") {
      const interestOnly = principal * monthlyRate

      for (let i = 1; i <= months; i++) {
        let payment = interestOnly
        let principalPayment = 0

        if (i === months) {
          payment += principal
          principalPayment = principal
          remaining = 0
        }

        newSchedule.push({
          month: i,
          payment: payment,
          principal: principalPayment,
          interest: interestOnly,
          balance: remaining,
        })
      }

      monthly = interestOnly
    }

    setMonthlyPayment(Math.round(monthly))
    setSchedule(newSchedule)
  }

  useEffect(() => {
    axios
      .get("https://script.google.com/macros/s/AKfycbwC9oZpvsrZ9eMPWd4adk4llpp8xijeOWZMAN8kTYatSXbRqoezD-PBeHkK7bbk95cK/exec")
      .then((res) => {
        setData(res.data)
        setFilteredData(res.data)
      })
      .catch((err) => {
        console.error("API 오류:", err)
      })
  }, [])

  useEffect(() => {
    let temp = [...data]

    if (selectedDistrict !== "전체") {
      temp = temp.filter(item => item.district === selectedDistrict)
    }

    if (selectedStatus !== "전체") {
      const currentYear = new Date().getFullYear()

      temp = temp.filter(item => {
        if (!item.build_year) return false
        const age = currentYear - Number(item.build_year)

        if (selectedStatus === "신축") return age <= 20
        else return age > 20
      })
    }

    if (selectedType !== "전체") {
      temp = temp.filter(item => item.property_type === selectedType)
    }

    if (sortOrder === "asc") temp.sort((a, b) => a.price - b.price)
    if (sortOrder === "desc") temp.sort((a, b) => b.price - a.price)

    if (budget || loan) {
      const totalBudget = (Number(budget) + Number(loan)) * 100000000
      temp = temp.filter(item => item.price <= totalBudget)
    }

    setFilteredData(temp)

  }, [data, selectedDistrict, selectedStatus, selectedType, sortOrder, budget, loan])

  return (
  <div className="min-h-screen bg-background text-white">
  <div className="relative w-full h-[380px] rounded-3xl overflow-hidden mb-16">
  {/* 배경 이미지 */}
  <img
    src="/images/seoul.jpg"  // public/images/seoul.jpg 경로
    alt="서울 아파트 전경"
    className="absolute inset-0 w-full h-full object-cover"
  />

  {/* 반투명 오버레이 */}
  <div className="absolute inset-0 bg-black/60"></div>

  {/* 텍스트 */}
  <div className="relative z-10 flex flex-col justify-center items-center h-full text-center px-6">
    <h1 className="text-7xl md:text-5xl font-extrabold text-white tracking-tight">
      BIRD MAP 집핏
    </h1>
    <p className="mt-4 text-lg text-gray-200">
      내 집 마련을 위한 전략
    </p>
  </div>
</div>

    <div className="max-w-7xl mx-auto p-0">

      <h1 className="text-0 font-extrabold mb-0 tracking-tight">
         <span className="text-White"> </span>
      </h1>

      {/* 필터 영역 */}
      <div className="mb-10 flex flex-wrap gap-4 items-center bg-card p-4 rounded-2xl border border-white/5 shadow-lg">

        <select onChange={(e) => setSelectedDistrict(e.target.value)}
          className="bg-white/5 border border-white/10 p-2 rounded-xl focus:bg-white/90 focus:text-[#1A1D24]">
          <option value="전체">전체 구</option>
          {[...new Set(data.map(item => item.district))].map((district, idx) => (
            <option key={idx} value={district}>{district}</option>
          ))}
        </select>

        <select onChange={(e) => setSelectedType(e.target.value)}
          className="bg-white/5 border border-white/10 p-2 rounded-xl focus:bg-white/90 focus:text-[#1A1D24]">
          <option value="전체">전체 유형</option>
          {[...new Set(data.map(item => item.property_type))].map((type, idx) => (
            <option key={idx} value={type}>{type}</option>
          ))}
        </select>

        <select onChange={(e) => setSelectedStatus(e.target.value)}
          className="bg-white/5 border border-white/10 p-2 rounded-xl focus:bg-white/90 focus:text-[#1A1D24]">
          <option value="전체">전체</option>
          <option value="신축">신축</option>
          <option value="구축">구축</option>
        </select>

        <select onChange={(e) => setSortOrder(e.target.value)}
          className="bg-white/5 border border-white/10 p-2 rounded-xl focus:bg-white/90 focus:text-[#1A1D24]">
          <option value="none">가격 정렬 없음</option>
          <option value="asc">가격 낮은순</option>
          <option value="desc">가격 높은순</option>
        </select>

        <button
          onClick={() => setUnit(unit === "㎡" ? "평" : "㎡")}
          className="px-4 py-2 rounded-xl bg-primary text-white font-semibold hover:scale-105 transition">
          단위 변경 ({unit})
        </button>

        <input
          type="number"
          placeholder="예상 순자산 (억)"
          value={budget}
          onChange={(e) => setBudget(e.target.value)}
          className="bg-white/5 border border-white/10 p-2 rounded-xl focus:ring-2 focus:ring-primary"
        />

        <input
          type="number"
          placeholder="대출 가능액 (억)"
          value={loan}
          onChange={(e) => setLoan(e.target.value)}
          className="bg-white/5 border border-white/10 p-2 rounded-xl focus:ring-2 focus:ring-primary"
        />
      </div>

      {/* 대출 계산기 */}
      <div className="mt-4 p-2 rounded-2xl bg-card border border-white/5 shadow-[0_0_40px_rgba(0,255,163,0.05)]">

        <h2 className="text-xl font-bold mb-3 text-white">
          대출 상환 계산기
        </h2>

        <div className="flex flex-wrap gap-4">

          <input type="number" placeholder="대출금액 (억)"
            value={loan}
            onChange={(e) => setLoan(e.target.value)}
            className="bg-white/5 border border-white/10 p-2 rounded-xl" />

          <input type="number" placeholder="연 이자율 (%)"
            value={interestRate}
            onChange={(e) => setInterestRate(e.target.value)}
            className="bg-white/5 border border-white/10 p-2 rounded-xl" />

          <input type="number" placeholder="대출기간 (년)"
            value={loanPeriod}
            onChange={(e) => setLoanPeriod(e.target.value)}
            className="bg-white/5 border border-white/10 p-2 rounded-xl" />

          <select value={repayType}
            onChange={(e) => setRepayType(e.target.value)}
            className="bg-white/5 border border-white/10 p-2 rounded-xl">
            <option value="원리금균등">원리금균등</option>
            <option value="원금균등">원금균등</option>
            <option value="만기일시상환">만기일시상환</option>
          </select>

          <button onClick={calculateLoan}
            className="px-6 py-2 bg-primary text-white font-bold rounded-xl hover:scale-105 transition">
            계산하기
          </button>

        </div>

        {monthlyPayment && (
          <div className="mt-6 text-lg font-semibold">
            월 상환액: <span className="text-primary">
              {monthlyPayment.toLocaleString()} 원
            </span>
          </div>
        )}
      </div>

      {/* 카드 영역 */}
      <div className="grid grid-cols-[repeat(auto-fill,minmax(280px,1fr))] gap-6 mt-4">

        {filteredData.map((item, idx) => (
          <div key={idx}
            className="relative bg-card border border-white/5 rounded-2xl p-6 shadow-md hover:shadow-[0_0_50px_rgba(0,255,163,0.15)] hover:scale-[1.02] transition-all duration-300">

            <div className="text-xs text-gray-400">
              {item.district} | {item.dong}
            </div>

            <h3 className="my-3 font-semibold text-lg">
              {item.building_name}
            </h3>

            <div className="text-2xl font-bold text-white">
              {(item.price / 100000000).toFixed(1)}억
            </div>

            <div className="mt-2 text-sm text-gray-300">
              {unit === "㎡"
                ? item.area
                : (Number(item.area) * 0.3025).toFixed(1)} {unit}
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {item.floor}층
            </div>

            <div className="text-xs text-gray-500 mt-1">
              {item.build_year ? `${item.build_year}년 준공` : "준공년도 정보없음"}
            </div>

            <input
              type="text"
              placeholder="외부 사이트 URL 입력"
              className="w-full mt-4 p-2 text-xs bg-white/5 border border-white/10 rounded-lg"
              onKeyDown={(e) => {
                if (e.key === "Enter") {
                  window.open(e.target.value, "_blank")
                }
              }}
            />

            <button
              onClick={() => {
                const key = `${item.building_name}-${item.dong}-${item.price}`
                setFavorites(prev => ({
                  ...prev,
                  [key]: !prev[key],
                }))
              }}
              className={`absolute top-4 right-4 px-3 py-1 text-xs rounded-lg transition ${
                favorites[`${item.building_name}-${item.dong}-${item.price}`]
                  ? "bg-primary text-white"
                  : "bg-white/10"
              }`}
            >
              {favorites[`${item.building_name}-${item.dong}-${item.price}`]
                ? "⭐ 관심 매물"
                : "☆ 관심 등록"}
            </button>

          </div>
        ))}

      </div>

    </div>
  </div>
)
}

export default App