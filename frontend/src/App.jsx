import { useState, useEffect } from 'react'
import axios from 'axios'
import { 
  Plus, Trash2, TrendingUp, TrendingDown, Wallet, 
  PieChart as PieIcon, BarChart3, LayoutDashboard, LogOut, Menu, X
} from 'lucide-react'
import { 
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, 
  PieChart, Pie, Legend 
} from 'recharts'

// --- CONFIGURAÇÃO DE DESIGN SYSTEM ---
const THEME = {
  colors: {
    primary: '#6366f1',
    success: '#10b981',
    danger: '#ef4444',
    bg: '#f8fafc',
    surface: '#ffffff',
    text: {
      primary: '#1e293b',
      secondary: '#64748b',
      muted: '#94a3b8'
    },
    border: '#e2e8f0'
  },
  shadow: '0 4px 6px -1px rgb(0 0 0 / 0.05), 0 2px 4px -2px rgb(0 0 0 / 0.05)',
  radius: '12px'
}

const PIE_COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#8b5cf6', '#ec4899']

// Hook para detectar tamanho da tela
function useWindowSize() {
  const [windowSize, setWindowSize] = useState({
    width: typeof window !== 'undefined' ? window.innerWidth : 1200,
  })

  useEffect(() => {
    function handleResize() {
      setWindowSize({ width: window.innerWidth })
    }
    window.addEventListener('resize', handleResize)
    return () => window.removeEventListener('resize', handleResize)
  }, [])

  return windowSize
}

function App() {
  const [transacoes, setTransacoes] = useState([])
  const [activeTab, setActiveTab] = useState('dashboard')
  const [form, setForm] = useState({ descricao: "", valor: "", tipo: "receita", categoria: "Salário" })
  const [isLoading, setIsLoading] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const { width } = useWindowSize()
  const isMobile = width < 768
  const isTablet = width < 1024

  useEffect(() => { carregarTransacoes() }, [])

  const carregarTransacoes = async () => {
    try {
      const response = await axios.get('http://127.0.0.1:8000/transacoes/')
      setTransacoes(response.data)
    } catch (error) { console.error("Erro:", error) }
  }

  const salvarTransacao = async () => {
    if (!form.descricao || !form.valor) return
    setIsLoading(true)
    try {
      await axios.post('http://127.0.0.1:8000/transacoes/', { ...form, valor: parseFloat(form.valor) })
      setForm({ descricao: "", valor: "", tipo: "receita", categoria: "Salário" })
      carregarTransacoes()
    } catch (error) { console.error("Erro:", error) }
    setIsLoading(false)
  }

  const deletarTransacao = async (id) => {
    await axios.delete(`http://127.0.0.1:8000/transacoes/${id}`)
    carregarTransacoes()
  }

  // --- FUNÇÃO DE EXPORTAR CSV ---
  // --- FUNÇÃO DE EXPORTAR CSV (Versão Excel Brasil) ---
  const exportarRelatorio = () => {
    if (transacoes.length === 0) return alert("Sem dados para exportar.")

    // 1. Cabeçalho usando PONTO E VÍRGULA (;)
    const headers = ["ID;Descrição;Valor;Tipo;Categoria;Data"]

    // 2. Dados
    const rows = transacoes.map(t => {
      const dataFormatada = new Date().toLocaleDateString('pt-BR')
      
      // Ajuste fino: Trocamos o ponto do decimal por vírgula para o Excel entender como número
      const valorFormatado = t.valor.toString().replace('.', ',')

      return `${t.id};"${t.descricao}";${valorFormatado};${t.tipo};${t.categoria};${dataFormatada}`
    })

    // 3. Adiciona o BOM (\uFEFF) para o Excel entender acentos (UTF-8)
    const csvContent = "\uFEFF" + [headers, ...rows].join("\n")

    // 4. Download
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' })
    const url = URL.createObjectURL(blob)
    const link = document.createElement('a')
    link.href = url
    link.setAttribute('download', 'finance_flow_relatorio.csv')
    document.body.appendChild(link)
    link.click()
    document.body.removeChild(link)
  }

  // Cálculos
  const receitas = transacoes.filter(t => t.tipo === 'receita').reduce((acc, t) => acc + t.valor, 0)
  const despesas = transacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => acc + t.valor, 0)
  const saldo = receitas - despesas

  const dadosBarra = [
    { name: 'Receitas', valor: receitas },
    { name: 'Despesas', valor: despesas }
  ]

  const dadosPizza = Object.entries(
    transacoes.filter(t => t.tipo === 'despesa').reduce((acc, t) => {
      acc[t.categoria] = (acc[t.categoria] || 0) + t.valor
      return acc
    }, {})
  ).map(([name, value]) => ({ name, value }))

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: THEME.colors.bg, fontFamily: "'Inter', sans-serif" }}>
      
      {/* OVERLAY MOBILE */}
      {isMobile && sidebarOpen && (
        <div 
          onClick={() => setSidebarOpen(false)}
          style={{
            position: 'fixed', top: 0, left: 0, right: 0, bottom: 0,
            background: 'rgba(0,0,0,0.5)', zIndex: 40
          }}
        />
      )}

      {/* SIDEBAR */}
      <aside style={{ 
        width: isMobile ? '280px' : '260px', 
        background: THEME.colors.surface, 
        borderRight: `1px solid ${THEME.colors.border}`, 
        padding: '30px 20px', 
        display: 'flex', 
        flexDirection: 'column',
        position: isMobile ? 'fixed' : 'relative',
        top: 0,
        left: isMobile ? (sidebarOpen ? 0 : '-300px') : 0,
        bottom: 0,
        zIndex: 50,
        transition: 'left 0.3s ease',
        boxShadow: isMobile && sidebarOpen ? '4px 0 15px rgba(0,0,0,0.1)' : 'none'
      }}>
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '40px', paddingLeft: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <div style={{ background: THEME.colors.primary, padding: '8px', borderRadius: '8px', color: 'white' }}><Wallet size={24} /></div>
            <h1 style={{ fontSize: '1.2rem', fontWeight: '800', color: THEME.colors.text.primary, letterSpacing: '-0.5px' }}>FinanceFlow</h1>
          </div>
          {isMobile && (
            <button onClick={() => setSidebarOpen(false)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: THEME.colors.text.muted, padding: '8px' }}>
              <X size={24} />
            </button>
          )}
        </div>
        
        <nav style={{ flex: 1 }}>
          <NavItem icon={LayoutDashboard} label="Dashboard" active={activeTab === 'dashboard'} onClick={() => { setActiveTab('dashboard'); if(isMobile) setSidebarOpen(false) }} />
          <NavItem icon={BarChart3} label="Relatórios" active={activeTab === 'relatorios'} onClick={() => { setActiveTab('relatorios'); if(isMobile) setSidebarOpen(false) }} />
          <NavItem icon={PieIcon} label="Orçamento" active={activeTab === 'orcamento'} onClick={() => { setActiveTab('orcamento'); if(isMobile) setSidebarOpen(false) }} />
        </nav>

        <button style={{ display: 'flex', alignItems: 'center', gap: '10px', color: THEME.colors.text.muted, background: 'none', border: 'none', padding: '12px', cursor: 'pointer', marginTop: 'auto' }}>
          <LogOut size={18} /> Sair
        </button>
      </aside>

      {/* ÁREA PRINCIPAL */}
      <main style={{ flex: 1, padding: isMobile ? '20px 16px' : isTablet ? '30px 30px' : '40px 50px', overflowY: 'auto', width: '100%' }}>
        
        {/* HEADER DA PÁGINA */}
        <header style={{ 
          display: 'flex', 
          flexDirection: isMobile ? 'column' : 'row',
          justifyContent: 'space-between', 
          alignItems: isMobile ? 'flex-start' : 'center', 
          marginBottom: isMobile ? '24px' : '40px',
          gap: isMobile ? '16px' : '0'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '16px', width: '100%' }}>
            {isMobile && (
              <button 
                onClick={() => setSidebarOpen(true)} 
                style={{ 
                  background: THEME.colors.surface, 
                  border: `1px solid ${THEME.colors.border}`, 
                  borderRadius: '8px',
                  padding: '10px', 
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  flexShrink: 0
                }}
              >
                <Menu size={20} color={THEME.colors.text.primary} />
              </button>
            )}
            <div style={{ flex: 1 }}>
              <h2 style={{ fontSize: isMobile ? '1.4rem' : '1.8rem', fontWeight: '700', color: THEME.colors.text.primary, marginBottom: '5px' }}>Visão Geral</h2>
              <p style={{ color: THEME.colors.text.secondary, fontSize: isMobile ? '0.85rem' : '1rem' }}>Olá, aqui está o resumo das suas finanças.</p>
            </div>
          </div>
          {!isMobile && (
            <button onClick={exportarRelatorio} style={{...styles.primaryButton, flexShrink: 0}}>
              Exportar Relatório
            </button>
          )}
        </header>

        {/* CARDS KPI */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile ? '1fr' : isTablet ? 'repeat(2, 1fr)' : 'repeat(3, 1fr)', 
          gap: isMobile ? '16px' : '24px', 
          marginBottom: isMobile ? '24px' : '40px' 
        }}>
          <KpiCard title="Entradas Totais" value={receitas} icon={TrendingUp} color={THEME.colors.success} isMobile={isMobile} />
          <KpiCard title="Saídas Totais" value={despesas} icon={TrendingDown} color={THEME.colors.danger} isMobile={isMobile} />
          <KpiCard 
            title="Saldo Atual" 
            value={saldo} 
            icon={Wallet} 
            color={saldo >= 0 ? THEME.colors.primary : THEME.colors.danger} 
            isMain 
            isMobile={isMobile}
            extraStyle={isTablet && !isMobile ? { gridColumn: 'span 2' } : {}}
          />
        </div>

        {/* CONTEÚDO GRID */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: isMobile || isTablet ? '1fr' : '2fr 1fr', 
          gap: isMobile ? '20px' : '30px' 
        }}>
          
          {/* NOVA TRANSAÇÃO - Mobile primeiro */}
          {isMobile && (
            <Card title="Nova Transação" isMobile={isMobile}>
              <FormTransacao form={form} setForm={setForm} salvarTransacao={salvarTransacao} isLoading={isLoading} />
            </Card>
          )}

          {/* COLUNA ESQUERDA (Maior) */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: isMobile ? '20px' : '30px' }}>
            
            {/* GRÁFICO BARRAS */}
            <Card title="Fluxo de Caixa Mensal" isMobile={isMobile}>
              <div style={{ height: isMobile ? '220px' : '300px', marginTop: '10px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={dadosBarra} barSize={isMobile ? 40 : 60}>
                    <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: THEME.colors.text.muted, fontSize: isMobile ? 12 : 14}} />
                    <YAxis axisLine={false} tickLine={false} tick={{fill: THEME.colors.text.muted, fontSize: isMobile ? 12 : 14}} width={isMobile ? 50 : 60} />
                    <Tooltip cursor={{fill: 'transparent'}} contentStyle={{borderRadius: '8px', border: 'none', boxShadow: THEME.shadow}} />
                    <Bar dataKey="valor" radius={[6, 6, 0, 0]}>
                      {dadosBarra.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={index === 0 ? THEME.colors.success : THEME.colors.danger} />
                      ))}
                    </Bar>
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </Card>

            {/* TABELA RECENTES */}
            <Card title="Transações Recentes" isMobile={isMobile}>
              {transacoes.length === 0 ? (
                <div style={{ padding: isMobile ? '30px 20px' : '40px', textAlign: 'center', color: THEME.colors.text.muted }}>Nenhuma transação registrada.</div>
              ) : (
                <div style={{ marginTop: '15px' }}>
                  {transacoes.slice().reverse().map(t => (
                    <div key={t.id} style={{
                      display: 'flex', 
                      flexDirection: isMobile ? 'column' : 'row',
                      justifyContent: 'space-between', 
                      alignItems: isMobile ? 'flex-start' : 'center', 
                      padding: isMobile ? '12px 0' : '16px 0',
                      borderBottom: `1px solid ${THEME.colors.border}`,
                      gap: isMobile ? '12px' : '0'
                    }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: isMobile ? '12px' : '15px' }}>
                        <div style={{ 
                          width: isMobile ? '36px' : '40px', 
                          height: isMobile ? '36px' : '40px', 
                          borderRadius: '50%', 
                          background: t.tipo === 'receita' ? '#ecfdf5' : '#fef2f2',
                          color: t.tipo === 'receita' ? THEME.colors.success : THEME.colors.danger,
                          display: 'flex', alignItems: 'center', justifyContent: 'center',
                          flexShrink: 0
                        }}>
                          {t.tipo === 'receita' ? <TrendingUp size={isMobile ? 16 : 18} /> : <TrendingDown size={isMobile ? 16 : 18} />}
                        </div>
                        <div>
                          <strong style={{ display: 'block', color: THEME.colors.text.primary, fontSize: isMobile ? '0.9rem' : '0.95rem' }}>{t.descricao}</strong>
                          <span style={{ fontSize: '0.8rem', color: THEME.colors.text.muted }}>{t.categoria} • {new Date().toLocaleDateString()}</span>
                        </div>
                      </div>
                      <div style={{ 
                        display: 'flex', 
                        alignItems: 'center', 
                        justifyContent: isMobile ? 'space-between' : 'flex-end',
                        gap: '20px',
                        width: isMobile ? '100%' : 'auto',
                        paddingLeft: isMobile ? '48px' : '0'
                      }}>
                        <span style={{ fontWeight: '600', color: t.tipo === 'receita' ? THEME.colors.success : THEME.colors.danger }}>
                          {t.tipo === 'receita' ? '+' : '-'} R$ {t.valor.toFixed(2)}
                        </span>
                        <button onClick={() => deletarTransacao(t.id)} style={styles.iconButton}><Trash2 size={16} /></button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </Card>
          </div>

          {/* COLUNA DIREITA - Desktop/Tablet */}
          {!isMobile && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '30px' }}>
              
              <Card title="Nova Transação">
                <FormTransacao form={form} setForm={setForm} salvarTransacao={salvarTransacao} isLoading={isLoading} />
              </Card>

              <Card title="Gastos por Categoria">
                <div style={{ height: '250px' }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie 
                        data={dadosPizza} cx="50%" cy="50%" innerRadius={60} outerRadius={80} 
                        paddingAngle={5} dataKey="value" stroke="none"
                      >
                        {dadosPizza.map((entry, index) => (
                          <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: THEME.shadow}} />
                      <Legend verticalAlign="bottom" height={36} iconType="circle" />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </Card>

            </div>
          )}

          {/* GRÁFICO PIZZA - Mobile */}
          {isMobile && (
            <Card title="Gastos por Categoria" isMobile={isMobile}>
              <div style={{ height: '280px' }}>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie 
                      data={dadosPizza} cx="50%" cy="45%" innerRadius={50} outerRadius={70} 
                      paddingAngle={5} dataKey="value" stroke="none"
                    >
                      {dadosPizza.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} />
                      ))}
                    </Pie>
                    <Tooltip contentStyle={{borderRadius: '8px', border: 'none', boxShadow: THEME.shadow}} />
                    <Legend verticalAlign="bottom" height={50} iconType="circle" />
                  </PieChart>
                </ResponsiveContainer>
              </div>
            </Card>
          )}

          {/* BOTÃO EXPORTAR - Mobile */}
          {isMobile && (
            <button onClick={exportarRelatorio} style={{...styles.primaryButton, width: '100%', padding: '14px'}}>
              Exportar Relatório
            </button>
          )}
        </div>
      </main>
    </div>
  )
}

// --- SUB-COMPONENTES ---

function FormTransacao({ form, setForm, salvarTransacao, isLoading }) {
  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: '15px', marginTop: '10px' }}>
      <input 
        placeholder="Ex: Aluguel, Freelance..." 
        value={form.descricao} 
        onChange={e => setForm({...form, descricao: e.target.value})} 
        style={styles.input} 
      />
      
      <div style={{ position: 'relative' }}>
        <span style={{ position: 'absolute', left: '12px', top: '12px', color: THEME.colors.text.muted, fontSize: '0.9rem' }}>R$</span>
        <input 
          type="number" 
          placeholder="0.00" 
          value={form.valor} 
          onChange={e => setForm({...form, valor: e.target.value})} 
          style={{ ...styles.input, paddingLeft: '35px' }} 
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '10px' }}>
        <select value={form.tipo} onChange={e => setForm({...form, tipo: e.target.value})} style={styles.input}>
          <option value="receita">Entrada</option>
          <option value="despesa">Saída</option>
        </select>
        <select value={form.categoria} onChange={e => setForm({...form, categoria: e.target.value})} style={styles.input}>
          <option>Salário</option>
          <option>Transporte</option>
          <option>Alimentação</option>
          <option>Moradia</option>
          <option>Lazer</option>
          <option>Outros</option>
        </select>
      </div>

      <button onClick={salvarTransacao} style={styles.primaryButton} disabled={isLoading}>
        {isLoading ? 'Salvando...' : <><Plus size={18} /> Adicionar Transação</>}
      </button>
    </div>
  )
}

function NavItem({ icon: Icon, label, active, onClick }) {
  return (
    <button 
      onClick={onClick}
      style={{
        display: 'flex', alignItems: 'center', gap: '12px', width: '100%', padding: '12px 16px',
        background: active ? '#eff6ff' : 'transparent', color: active ? THEME.colors.primary : THEME.colors.text.secondary,
        border: 'none', borderRadius: '8px', cursor: 'pointer', fontWeight: active ? '600' : '500',
        marginBottom: '5px', transition: 'all 0.2s', fontSize: '0.95rem'
      }}
    >
      <Icon size={20} /> {label}
    </button>
  )
}

function KpiCard({ title, value, icon: Icon, color, isMain, isMobile, extraStyle = {} }) {
  return (
    <div style={{ 
      background: THEME.colors.surface, 
      padding: isMobile ? '20px' : '24px', 
      borderRadius: THEME.radius, 
      boxShadow: THEME.shadow, 
      border: `1px solid ${THEME.colors.border}`,
      display: 'flex', 
      flexDirection: 'column', 
      justifyContent: 'space-between',
      ...extraStyle
    }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'start', marginBottom: '15px' }}>
        <span style={{ color: THEME.colors.text.secondary, fontSize: isMobile ? '0.85rem' : '0.9rem', fontWeight: '500' }}>{title}</span>
        <div style={{ background: color + '15', padding: isMobile ? '6px' : '8px', borderRadius: '8px', color: color }}>
          <Icon size={isMobile ? 18 : 20} />
        </div>
      </div>
      <h2 style={{ fontSize: isMobile ? '1.5rem' : '1.8rem', fontWeight: '700', color: THEME.colors.text.primary, margin: 0 }}>
        R$ {value ? value.toFixed(2) : '0.00'}
      </h2>
      {isMain && <span style={{ fontSize: '0.8rem', color: THEME.colors.success, marginTop: '5px' }}>+12% vs mês anterior</span>}
    </div>
  )
}

function Card({ title, children, isMobile }) {
  return (
    <div style={{ 
      background: THEME.colors.surface, 
      padding: isMobile ? '20px' : '24px', 
      borderRadius: THEME.radius, 
      boxShadow: THEME.shadow, 
      border: `1px solid ${THEME.colors.border}`
    }}>
      <h3 style={{ margin: '0 0 15px 0', fontSize: '1.1rem', fontWeight: '600', color: THEME.colors.text.primary }}>{title}</h3>
      {children}
    </div>
  )
}

const styles = {
  input: {
    width: '100%', padding: '12px', borderRadius: '8px', border: `1px solid ${THEME.colors.border}`,
    fontSize: '0.95rem', color: THEME.colors.text.primary, outline: 'none', background: '#f8fafc',
    boxSizing: 'border-box'
  },
  primaryButton: {
    background: THEME.colors.primary, color: 'white', border: 'none', padding: '12px 20px',
    borderRadius: '8px', cursor: 'pointer', fontWeight: '600', display: 'flex', alignItems: 'center', 
    justifyContent: 'center', gap: '8px', fontSize: '0.95rem', transition: 'opacity 0.2s'
  },
  iconButton: {
    background: 'transparent', border: 'none', cursor: 'pointer', color: THEME.colors.text.muted,
    padding: '8px', borderRadius: '6px', transition: 'background 0.2s', display: 'flex'
  }
}

export default App