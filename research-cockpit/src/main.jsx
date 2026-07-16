import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Archive,
  ArrowLeft,
  ArrowRight,
  ArrowUpRight,
  BookOpen,
  CalendarDays,
  Check,
  CheckCircle2,
  ChevronDown,
  ChevronRight,
  Circle,
  Clock3,
  Command,
  Copy,
  ExternalLink,
  FileChartColumn,
  FileText,
  FlaskConical,
  Focus,
  Gauge,
  GitBranch,
  Github,
  Home,
  LayoutDashboard,
  ListFilter,
  Mail,
  Map,
  Menu,
  MoreHorizontal,
  Pause,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Search,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import './styles.css'

const initialTasks = [
  { id: 1, title: '复现 R-CFFA 的特征聚合模块', meta: '深度工作 · 90 分钟', tag: '代码', done: false },
  { id: 2, title: '精读 AgentBench 实验设计', meta: '论文阅读 · 45 分钟', tag: '阅读', done: true },
  { id: 3, title: '整理消融实验变量与对照组', meta: '实验设计 · 30 分钟', tag: '实验', done: false },
]

const initialPapers = [
  {
    id: 1,
    title: 'AgentBench: Evaluating LLMs as Agents',
    venue: 'ICLR 2024',
    status: '精读',
    progress: 72,
    tags: ['Agent', 'Benchmark'],
    note: '重点检查多环境指标是否能迁移到当前评估框架。已记录任务成功率与成本指标的冲突。',
  },
  {
    id: 2,
    title: 'A Survey on Large Language Model based Autonomous Agents',
    venue: 'Frontiers of CS 2024',
    status: '在读',
    progress: 38,
    tags: ['Survey', 'Planning'],
    note: '用于补齐记忆、规划与工具调用的研究谱系，下一步整理比较矩阵。',
  },
  {
    id: 3,
    title: 'ReAct: Synergizing Reasoning and Acting in Language Models',
    venue: 'ICLR 2023',
    status: '已归档',
    progress: 100,
    tags: ['Reasoning', 'Tool Use'],
    note: '已提取核心范式与失败案例，可作为方法章节的基础引用。',
  },
  {
    id: 4,
    title: 'Language Models as Zero-Shot Planners',
    venue: 'NeurIPS 2022',
    status: '待读',
    progress: 0,
    tags: ['Planning', 'Baseline'],
    note: '用于建立规划基线，优先阅读实验设置与错误类型。',
  },
  {
    id: 5,
    title: 'Toolformer: Language Models Can Teach Themselves to Use Tools',
    venue: 'NeurIPS 2023',
    status: '待读',
    progress: 0,
    tags: ['Tool Use', 'Self-supervision'],
    note: '关注工具调用数据构造方式与筛选策略。',
  },
]

const initialExperiments = [
  { id: 'R-017', name: '门控残差消融', status: '运行中', metric: 'F1 84.6', change: '+1.8', progress: 64, eta: '预计 42 分钟', seed: '3 / 5' },
  { id: 'R-016', name: '检索深度对比', status: '已完成', metric: 'F1 82.8', change: '+0.7', progress: 100, eta: '7 月 15 日', seed: '5 / 5' },
  { id: 'R-018', name: '跨域泛化测试', status: '排队', metric: '尚无结果', change: '—', progress: 0, eta: '等待 GPU', seed: '0 / 5' },
  { id: 'R-015', name: '学习率敏感性', status: '已暂停', metric: 'F1 79.4', change: '-2.1', progress: 41, eta: '需要检查', seed: '2 / 5' },
]

const artifacts = [
  { type: '图表', title: '门控系数与 F1 关系', meta: '来自实验 R-016 · SVG', icon: FileChartColumn, accent: 'green' },
  { type: '结论', title: '检索深度超过 5 后收益趋缓', meta: '证据：3 组数据集 / 5 个随机种子', icon: Sparkles, accent: 'orange' },
  { type: '代码', title: '可复现实验运行器 v0.3', meta: '12 个配置 · 最后更新于昨天', icon: GitBranch, accent: 'blue' },
  { type: '文档', title: '相关工作比较矩阵', meta: '28 篇论文 · 7 个比较维度', icon: FileText, accent: 'gray' },
]

const navItems = [
  { id: 'dashboard', label: '总览', icon: LayoutDashboard },
  { id: 'learning', label: '学习规划', icon: Map },
  { id: 'papers', label: '论文阅读', icon: BookOpen },
  { id: 'experiments', label: '实验管理', icon: FlaskConical },
  { id: 'archive', label: '成果归档', icon: Archive },
]

const pipeline = [
  { id: 'question', label: '问题', value: '3 个待验证', complete: true },
  { id: 'reading', label: '阅读', value: '2 篇进行中', complete: true },
  { id: 'hypothesis', label: '假设', value: 'H-04 已形成', complete: true },
  { id: 'experiment', label: '实验', value: 'R-017 运行中', current: true },
  { id: 'conclusion', label: '结论', value: '等待验证', pending: true },
]

const week = [
  { day: '一', date: '13', value: 80, state: 'done' },
  { day: '二', date: '14', value: 65, state: 'done' },
  { day: '三', date: '15', value: 92, state: 'done' },
  { day: '四', date: '16', value: 54, state: 'today' },
  { day: '五', date: '17', value: 38, state: 'next' },
  { day: '六', date: '18', value: 20, state: 'next' },
  { day: '日', date: '19', value: 10, state: 'next' },
]

function usePersistentState(key, initialValue) {
  const [value, setValue] = useState(() => {
    try {
      const saved = localStorage.getItem(key)
      return saved ? JSON.parse(saved) : initialValue
    } catch {
      return initialValue
    }
  })

  useEffect(() => {
    localStorage.setItem(key, JSON.stringify(value))
  }, [key, value])

  return [value, setValue]
}

const viewToHash = {
  home: '#/',
  profile: '#/profile',
  dashboard: '#/dashboard',
  learning: '#/learning',
  papers: '#/papers',
  experiments: '#/experiments',
  archive: '#/archive',
}

const hashToView = Object.fromEntries(Object.entries(viewToHash).map(([view, hash]) => [hash, view]))

const profile = {
  name: 'Your Name',
  role: '独立研究者 / Researcher',
  introduction: '围绕智能体、学习系统与可复现实验，持续把阅读、代码和结论沉淀成可以再次使用的研究资产。',
  focus: ['智能体系统', '实验设计', '知识沉淀'],
  email: 'your.email@example.com',
  githubUrl: '',
  githubLabel: 'github.com/your-handle',
}

function getViewFromHash() {
  return hashToView[window.location.hash] || 'home'
}

function App() {
  const [activeView, setActiveView] = useState(getViewFromHash)
  const [tasks, setTasks] = usePersistentState('cockpit-tasks', initialTasks)
  const [papers, setPapers] = usePersistentState('cockpit-papers', initialPapers)
  const [experiments, setExperiments] = usePersistentState('cockpit-experiments', initialExperiments)
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('cockpit-sidebar-collapsed', false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState('')

  useEffect(() => {
    if (!window.location.hash || !hashToView[window.location.hash]) {
      window.history.replaceState(null, '', viewToHash.home)
      setActiveView('home')
    }

    const syncViewFromHash = () => setActiveView(getViewFromHash())
    window.addEventListener('hashchange', syncViewFromHash)
    return () => window.removeEventListener('hashchange', syncViewFromHash)
  }, [])

  useEffect(() => {
    const onKeyDown = (event) => {
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === 'k') {
        event.preventDefault()
        setSearchOpen(true)
      }
      if (event.key === 'Escape') {
        setSearchOpen(false)
        setQuickAddOpen(false)
        setMobileMenuOpen(false)
      }
    }
    window.addEventListener('keydown', onKeyDown)
    return () => window.removeEventListener('keydown', onKeyDown)
  }, [])

  useEffect(() => {
    if (!toast) return undefined
    const timer = window.setTimeout(() => setToast(''), 2200)
    return () => window.clearTimeout(timer)
  }, [toast])

  const changeView = (view) => {
    const nextHash = viewToHash[view] || viewToHash.home
    if (window.location.hash !== nextHash) {
      window.location.hash = nextHash
    }
    setActiveView(view)
    setMobileMenuOpen(false)
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const toggleTask = (taskId) => {
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)))
  }

  const addItem = ({ type, title, detail }) => {
    const id = Date.now()
    if (type === 'task') {
      setTasks((current) => [...current, { id, title, meta: detail || '新任务 · 待安排', tag: '计划', done: false }])
    }
    if (type === 'paper') {
      setPapers((current) => [...current, { id, title, venue: detail || '待补充来源', status: '待读', progress: 0, tags: ['新收录'], note: '尚未添加阅读笔记。' }])
    }
    if (type === 'experiment') {
      setExperiments((current) => [...current, { id: `R-${String(current.length + 15).padStart(3, '0')}`, name: title, status: '排队', metric: '尚无结果', change: '—', progress: 0, eta: detail || '等待安排', seed: '0 / 5' }])
    }
    setQuickAddOpen(false)
    setToast('已加入研究工作台')
  }

  const viewProps = { tasks, papers, experiments, toggleTask, setToast, changeView }
  const isPortalView = activeView === 'home' || activeView === 'profile'

  return (
    <div className={`app-shell ${isPortalView ? 'portal-app' : ''} ${activeView === 'profile' ? 'profile-app' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {activeView === 'home' && <PortalHome changeView={changeView} />}
      {activeView === 'profile' && <ProfilePage changeView={changeView} setToast={setToast} />}

      {!isPortalView && <>
        <Sidebar activeView={activeView} changeView={changeView} onSearch={() => setSearchOpen(true)} onHome={() => changeView('home')} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((current) => !current)} />

        <header className="mobile-header">
          <button className="icon-button" onClick={() => setMobileMenuOpen(true)} aria-label="打开导航" title="打开导航">
            <Menu size={20} />
          </button>
          <Brand compact onHome={() => changeView('home')} />
          <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="搜索" title="搜索">
            <Search size={19} />
          </button>
        </header>

        <main className="main-content">
          <TopBar onSearch={() => setSearchOpen(true)} onAdd={() => setQuickAddOpen(true)} />
          {activeView === 'dashboard' && <Dashboard {...viewProps} />}
          {activeView === 'learning' && <LearningView {...viewProps} />}
          {activeView === 'papers' && <PapersView {...viewProps} />}
          {activeView === 'experiments' && <ExperimentsView {...viewProps} />}
          {activeView === 'archive' && <ArchiveView {...viewProps} />}
        </main>

        <MobileNav activeView={activeView} changeView={changeView} />
        <button className="mobile-add-button" onClick={() => setQuickAddOpen(true)} aria-label="快速记录" title="快速记录">
          <Plus size={21} />
        </button>
        {mobileMenuOpen && <MobileMenu activeView={activeView} changeView={changeView} onClose={() => setMobileMenuOpen(false)} onHome={() => changeView('home')} />}
        {searchOpen && <SearchDialog tasks={tasks} papers={papers} experiments={experiments} onClose={() => setSearchOpen(false)} changeView={changeView} />}
        {quickAddOpen && <QuickAddDialog onClose={() => setQuickAddOpen(false)} onAdd={addItem} />}
      </>}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

function PortalHome({ changeView }) {
  return (
    <main className="portal-home">
      <InkLandscape />
      <header className="portal-topbar">
        <button className="portal-wordmark" onClick={() => changeView('home')} aria-label="返回首页">
          <span className="portal-mark">研</span>
          <span><strong>Welcome to here</strong></span>
        </button>
        <span className="portal-date">2026 / 07 / 16</span>
      </header>

      <section className="portal-center" aria-labelledby="portal-title">
        <p className="portal-kicker">PERSONAL RESEARCH PORTAL</p>
        <h1 id="portal-title">光阴如箭，岁月如梭</h1>
        <p className="portal-caption">珍惜时间，珍惜当下</p>
        <div className="portal-actions" aria-label="入口选择">
          <button className="portal-action portal-action-left" onClick={() => changeView('profile')}>
            <ArrowLeft size={26} strokeWidth={1.5} />
            <span><small>01 / ABOUT</small><strong>个人资料</strong></span>
          </button>
          <span className="portal-divider" aria-hidden="true" />
          <button className="portal-action portal-action-right" onClick={() => changeView('dashboard')}>
            <span><small>02 / LAB</small><strong>学习成果</strong></span>
            <ArrowRight size={26} strokeWidth={1.5} />
          </button>
        </div>
      </section>

      <footer className="portal-footer"><span>RESEARCH · NOTES · EXPERIMENTS</span><span>SCROLL TO THINK SLOWLY</span></footer>
    </main>
  )
}

function InkLandscape() {
  const canvasRef = useRef(null)

  useEffect(() => {
    const canvas = canvasRef.current
    const context = canvas.getContext('2d')
    let width = 0
    let height = 0

    const paintMountain = (points, color) => {
      context.beginPath()
      context.moveTo(points[0][0] * width, height)
      points.forEach(([x, y]) => context.lineTo(x * width, y * height))
      context.lineTo(points[points.length - 1][0] * width, height)
      context.closePath()
      context.fillStyle = color
      context.fill()
    }

    const draw = () => {
      const scale = Math.min(window.devicePixelRatio || 1, 2)
      width = window.innerWidth
      height = window.innerHeight
      canvas.width = Math.round(width * scale)
      canvas.height = Math.round(height * scale)
      context.setTransform(scale, 0, 0, scale, 0, 0)

      const paper = context.createLinearGradient(0, 0, width, height)
      paper.addColorStop(0, '#f5f3ec')
      paper.addColorStop(0.55, '#f2f0e8')
      paper.addColorStop(1, '#eceae1')
      context.fillStyle = paper
      context.fillRect(0, 0, width, height)

      context.globalAlpha = 0.12
      for (let index = 0; index < 280; index += 1) {
        const x = (index * 73) % width
        const y = (index * 41) % height
        context.fillStyle = index % 3 === 0 ? '#5c5b56' : '#aaa79d'
        context.fillRect(x, y, 1, 1)
      }
      context.globalAlpha = 1

      paintMountain([[0, 0.68], [0.05, 0.55], [0.1, 0.66], [0.16, 0.4], [0.22, 0.63], [0.29, 0.59], [0.36, 0.76]], 'rgba(23, 23, 21, 0.68)')
      paintMountain([[0, 0.79], [0.07, 0.64], [0.14, 0.72], [0.2, 0.5], [0.28, 0.7], [0.39, 0.83]], 'rgba(23, 23, 21, 0.32)')
      paintMountain([[0.63, 0.82], [0.72, 0.62], [0.78, 0.71], [0.86, 0.38], [0.92, 0.61], [1, 0.48], [1, 0.87]], 'rgba(23, 23, 21, 0.64)')
      paintMountain([[0.59, 0.9], [0.69, 0.72], [0.77, 0.78], [0.85, 0.55], [0.94, 0.69], [1, 0.6], [1, 1]], 'rgba(23, 23, 21, 0.29)')

      context.globalAlpha = 0.2
      context.fillStyle = '#545550'
      for (let index = 0; index < 18; index += 1) {
        const x = index < 9 ? width * (0.03 + index * 0.033) : width * (0.69 + (index - 9) * 0.034)
        const y = height * (0.31 + (index % 4) * 0.09)
        context.beginPath()
        context.ellipse(x, y, 10 + (index % 3) * 8, 1.5, -0.18, 0, Math.PI * 2)
        context.fill()
      }
      context.globalAlpha = 1
    }

    draw()
    window.addEventListener('resize', draw)
    return () => window.removeEventListener('resize', draw)
  }, [])

  return <div className="ink-stage" aria-hidden="true"><canvas ref={canvasRef} className="ink-canvas" /><span className="ink-mist ink-mist-one" /><span className="ink-mist ink-mist-two" /></div>
}

function ProfilePage({ changeView, setToast }) {
  const copyEmail = async () => {
    try {
      await navigator.clipboard.writeText(profile.email)
      setToast('邮箱已复制到剪贴板')
    } catch {
      setToast(`邮箱：${profile.email}`)
    }
  }

  return (
    <main className="profile-page">
      <header className="profile-topbar">
        <button className="profile-home-button" onClick={() => changeView('home')}><Home size={17} />返回首页</button>
        <span>PROFILE / 01</span>
      </header>
      <section className="profile-intro">
        <p className="profile-role">{profile.role}</p>
        <h1>{profile.name}</h1>
        <p>{profile.introduction}</p>
      </section>
      <div className="profile-grid">
        <section className="profile-section profile-focus">
          <span className="profile-index">01 / 研究方向</span>
          <h2>正在持续构建的能力</h2>
          <div className="profile-focus-list">{profile.focus.map((item, index) => <span key={item}><i>{String(index + 1).padStart(2, '0')}</i>{item}</span>)}</div>
        </section>
        <section className="profile-section profile-contact">
          <span className="profile-index">02 / 联系方式</span>
          <div className="contact-line"><Mail size={18} /><span><small>EMAIL</small><strong>{profile.email}</strong></span><button className="icon-button" onClick={copyEmail} aria-label="复制邮箱" title="复制邮箱"><Copy size={16} /></button></div>
        </section>
        <section className={`profile-section profile-github ${profile.githubUrl ? '' : 'is-empty'}`}>
          <span className="profile-index">03 / GITHUB 仓库</span>
          <Github size={27} />
          <h2>{profile.githubLabel}</h2>
          {profile.githubUrl ? <a href={profile.githubUrl} target="_blank" rel="noreferrer">访问仓库 <ArrowUpRight size={16} /></a> : <span className="github-placeholder">仓库地址待设置</span>}
        </section>
      </div>
      <footer className="profile-footer"><span>PERSONAL RESEARCH SPACE</span><button onClick={() => changeView('dashboard')}>进入学习结果 <ArrowRight size={16} /></button></footer>
    </main>
  )
}

function Brand({ compact = false, onHome }) {
  const content = <>
    <div className="brand-mark" aria-hidden="true">
      <span />
      <span />
      <span />
    </div>
    <div>
      <strong>学习成果</strong>
      {!compact && <small>LEARNING OUTCOMES</small>}
    </div>
  </>

  if (onHome) {
    return <button className={`brand brand-home ${compact ? 'brand-compact' : ''}`} onClick={onHome} aria-label="返回个人研究首页">{content}</button>
  }

  return (
    <div className={`brand ${compact ? 'brand-compact' : ''}`}>
      {content}
    </div>
  )
}

function Sidebar({ activeView, changeView, onSearch, onHome, collapsed, onToggleCollapse }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-brand-row">
        <Brand onHome={onHome} />
        <button className="sidebar-collapse-button" onClick={onToggleCollapse} aria-label={collapsed ? '展开导航栏' : '收起导航栏'} title={collapsed ? '展开导航栏' : '收起导航栏'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="side-nav" aria-label="主导航">
        {navItems.map((item) => {
          const Icon = item.icon
          return (
            <button key={item.id} className={activeView === item.id ? 'active' : ''} onClick={() => changeView(item.id)} title={item.label}>
              <Icon size={18} strokeWidth={1.8} />
              <span>{item.label}</span>
              {item.id === 'experiments' && <i aria-label="1 个实验运行中">1</i>}
            </button>
          )
        })}
      </nav>
      <div className="sidebar-spacer" />
      <button className="sidebar-search" onClick={onSearch}>
        <Search size={16} />
        <span>搜索工作台</span>
        <kbd>Ctrl K</kbd>
      </button>
      <div className="focus-streak">
        <div className="streak-ring"><span>12</span><small>天</small></div>
        <div><strong>连续专注</strong><small>本周已完成 18.5 小时</small></div>
      </div>
      <div className="profile-row">
        <div className="avatar">研</div>
        <div><strong>个人研究空间</strong><small>本地示例数据</small></div>
        <button className="icon-button subtle" aria-label="更多选项" title="更多选项"><MoreHorizontal size={18} /></button>
      </div>
    </aside>
  )
}

function TopBar({ onSearch, onAdd }) {
  return (
    <div className="topbar">
      <div className="date-lockup">
        <span>2026</span>
        <strong>07.16</strong>
        <small>周四 · 第 29 周</small>
      </div>
      <div className="topbar-actions">
        <button className="search-trigger" onClick={onSearch}><Search size={17} />搜索论文、实验或笔记<kbd>Ctrl K</kbd></button>
        <button className="primary-button" onClick={onAdd}><Plus size={17} />快速记录</button>
      </div>
    </div>
  )
}

function PageHeading({ eyebrow, title, description, action }) {
  return (
    <div className="page-heading">
      <div>
        <span className="eyebrow">{eyebrow}</span>
        <h1>{title}</h1>
        <p>{description}</p>
      </div>
      {action}
    </div>
  )
}

function Dashboard({ tasks, papers, experiments, toggleTask, setToast, changeView }) {
  const completed = tasks.filter((task) => task.done).length
  return (
    <div className="view dashboard-view">
      <PageHeading
        eyebrow="TODAY / 研究总览"
        title="任务进度"
        description={`今日 ${tasks.length} 项重点，${completed} 项已完成；实验 R-017 正在运行。`}
        action={<div className="heading-status"><span className="live-dot" />系统状态正常</div>}
      />

      <ResearchPipeline onSelect={(label) => setToast(`已聚焦：${label}阶段`)} />

      <div className="dashboard-grid">
        <section className="panel focus-panel">
          <SectionHeader title="今日重点" meta={`${completed} / ${tasks.length} 已完成`} icon={Focus} />
          <div className="task-list">
            {tasks.slice(0, 4).map((task, index) => (
              <label className={`task-row ${task.done ? 'done' : ''}`} key={task.id}>
                <input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} />
                <span className="custom-check">{task.done && <Check size={13} />}</span>
                <span className="task-index">{String(index + 1).padStart(2, '0')}</span>
                <span className="task-copy"><strong>{task.title}</strong><small>{task.meta}</small></span>
                <span className={`tag tag-${task.tag}`}>{task.tag}</span>
              </label>
            ))}
          </div>
          <button className="text-button" onClick={() => changeView('learning')}>打开学习规划<ChevronRight size={15} /></button>
        </section>

        <section className="panel experiment-panel">
          <SectionHeader title="实验状态" meta="1 个运行中" icon={FlaskConical} />
          <div className="active-run">
            <div className="run-topline"><span className="run-id">R-017</span><span className="status status-running"><span />运行中</span></div>
            <h3>门控残差消融</h3>
            <div className="metric-pair"><div><small>当前 F1</small><strong>84.6</strong></div><div><small>相对基线</small><strong className="positive">+1.8</strong></div></div>
            <div className="progress-track"><span style={{ width: '64%' }} /></div>
            <div className="run-footer"><span>Seed 3 / 5</span><span>预计 42 分钟</span></div>
          </div>
          <div className="run-list">
            {experiments.slice(1, 4).map((run) => (
              <button key={run.id} onClick={() => changeView('experiments')}>
                <span className={`run-state state-${run.status}`}>{run.status === '已完成' ? <Check size={13} /> : run.status === '已暂停' ? <Pause size={12} /> : <Clock3 size={12} />}</span>
                <span><strong>{run.id} · {run.name}</strong><small>{run.eta}</small></span>
                <ChevronRight size={15} />
              </button>
            ))}
          </div>
        </section>

        <section className="panel week-panel">
          <SectionHeader title="本周学习时长" meta="18.5 / 25 小时" icon={CalendarDays} />
          <div className="week-chart" aria-label="本周每天计划完成度">
            {week.map((day) => (
              <div className={`week-day ${day.state}`} key={day.date}>
                <div className="bar-space"><span style={{ height: `${day.value}%` }} /></div>
                <strong>{day.day}</strong><small>{day.date}</small>
              </div>
            ))}
          </div>
          <div className="week-note"><Target size={16} /><span>本周目标：完成核心模块复现，并锁定第一组消融结果。</span></div>
        </section>

        <section className="panel papers-panel">
          <SectionHeader title="论文阅读" meta={`${papers.filter((paper) => paper.status !== '已归档').length} 篇待推进`} icon={BookOpen} />
          <div className="paper-queue">
            {papers.slice(0, 3).map((paper) => (
              <button className="paper-row" key={paper.id} onClick={() => changeView('papers')}>
                <span className="paper-progress" style={{ '--progress': `${paper.progress * 3.6}deg` }}><i>{paper.progress}</i></span>
                <span className="paper-copy"><strong>{paper.title}</strong><small>{paper.venue} · {paper.status}</small></span>
                <ArrowUpRight size={16} />
              </button>
            ))}
          </div>
        </section>

        <section className="panel artifact-panel">
          <SectionHeader title="近期成果" meta="来自 R-016" icon={FileChartColumn} />
          <div className="result-visual">
            <div className="result-copy">
              <span className="eyebrow">LATEST EVIDENCE</span>
              <h3>检索深度达到 5 后，性能收益开始趋缓。</h3>
              <p>三个数据集呈现一致趋势，可进入方法章节的限制讨论。</p>
              <button className="text-button" onClick={() => changeView('archive')}>查看完整结果<ArrowUpRight size={15} /></button>
            </div>
            <MiniResultChart />
          </div>
        </section>
      </div>
    </div>
  )
}

function ResearchPipeline({ onSelect }) {
  return (
    <section className="pipeline" aria-label="研究流水线">
      <div className="pipeline-label"><Gauge size={17} /><span>全环节</span></div>
      <div className="pipeline-steps">
        {pipeline.map((step, index) => (
          <button key={step.id} className={`${step.current ? 'current' : ''} ${step.pending ? 'pending' : ''}`} onClick={() => onSelect(step.label)}>
            <span className="step-node">{step.complete ? <Check size={13} /> : step.current ? <Play size={12} fill="currentColor" /> : <Circle size={10} />}</span>
            <span className="step-copy"><small>{String(index + 1).padStart(2, '0')}</small><strong>{step.label}</strong><em>{step.value}</em></span>
          </button>
        ))}
      </div>
    </section>
  )
}

function SectionHeader({ title, meta, icon: Icon }) {
  return (
    <div className="section-header">
      <div><Icon size={17} strokeWidth={1.8} /><h2>{title}</h2></div>
      <span>{meta}</span>
    </div>
  )
}

function MiniResultChart() {
  return (
    <div className="mini-chart" aria-label="检索深度与 F1 指标折线图">
      <div className="chart-value"><strong>84.6</strong><span>最佳 F1</span></div>
      <svg viewBox="0 0 260 120" role="img" aria-label="指标从 78.2 上升到 84.6 后趋于平缓">
        <path className="grid-line" d="M20 25H244M20 60H244M20 95H244" />
        <path className="chart-area" d="M20 90 L64 76 L108 48 L152 31 L196 29 L240 28 L240 100 L20 100 Z" />
        <path className="chart-line" d="M20 90 L64 76 L108 48 L152 31 L196 29 L240 28" />
        <circle cx="152" cy="31" r="5" />
        <path className="guide-line" d="M152 31V100" />
      </svg>
      <div className="chart-axis"><span>1</span><span>3</span><span>5</span><span>7</span><span>9</span><span>检索深度</span></div>
    </div>
  )
}

function LearningView({ tasks, toggleTask, setToast }) {
  const roadmap = [
    { phase: '基础补齐', period: '07.01 — 07.14', title: 'Agent 系统与评估方法', progress: 100, status: '已完成' },
    { phase: '核心复现', period: '07.15 — 07.28', title: 'R-CFFA 方法实现与基线对齐', progress: 46, status: '进行中' },
    { phase: '实验验证', period: '07.29 — 08.18', title: '消融、泛化与误差分析', progress: 8, status: '下一阶段' },
    { phase: '论文成稿', period: '08.19 — 09.08', title: '证据整理与完整初稿', progress: 0, status: '未开始' },
  ]
  return (
    <div className="view">
      <PageHeading eyebrow="LEARNING / 学习规划" title="从问题出发，而不是从清单出发。" description="把学习任务绑定到当前研究假设，避免阅读和实现彼此脱节。" action={<button className="secondary-button" onClick={() => setToast('复盘模板已准备')}>开始本周复盘<ArrowUpRight size={16} /></button>} />
      <div className="metric-strip">
        <div><small>本周深度工作</small><strong>18.5h</strong><span className="positive">较上周 +3.2h</span></div>
        <div><small>路线总进度</small><strong>38%</strong><span>第 2 / 4 阶段</span></div>
        <div><small>当前核心目标</small><strong className="textual">完成核心模块复现</strong><span>距离检查点还有 12 天</span></div>
      </div>
      <div className="learning-layout">
        <section className="panel roadmap-panel">
          <SectionHeader title="研究学习路线" meta="2026 夏季周期" icon={Map} />
          <div className="roadmap-list">
            {roadmap.map((item, index) => (
              <div className={`roadmap-row ${item.status === '进行中' ? 'active' : ''}`} key={item.phase}>
                <span className="roadmap-number">{String(index + 1).padStart(2, '0')}</span>
                <span className="roadmap-line"><i style={{ height: `${item.progress}%` }} /></span>
                <div className="roadmap-copy"><span>{item.phase} · {item.period}</span><strong>{item.title}</strong><div className="progress-track"><i style={{ width: `${item.progress}%` }} /></div></div>
                <span className={`roadmap-status ${item.status === '进行中' ? 'active' : ''}`}>{item.status}</span>
              </div>
            ))}
          </div>
        </section>
        <aside className="learning-side">
          <section className="panel">
            <SectionHeader title="今日执行" meta={`${tasks.filter((task) => task.done).length}/${tasks.length}`} icon={CheckCircle2} />
            <div className="compact-task-list">
              {tasks.slice(0, 4).map((task) => (
                <label key={task.id} className={task.done ? 'done' : ''}><input type="checkbox" checked={task.done} onChange={() => toggleTask(task.id)} /><span className="custom-check">{task.done && <Check size={12} />}</span><strong>{task.title}</strong></label>
              ))}
            </div>
          </section>
          <section className="panel reflection-panel">
            <SectionHeader title="上周复盘" meta="07.06 — 07.12" icon={Focus} />
            <blockquote>“阅读覆盖面足够，但证据整理滞后。本周每完成一个实验，立即记录结论边界。”</blockquote>
            <div className="reflection-tags"><span>保持：上午深度工作</span><span>调整：减少并行任务</span></div>
          </section>
        </aside>
      </div>
    </div>
  )
}

function PapersView({ papers, setToast }) {
  const [filter, setFilter] = useState('全部')
  const [selectedId, setSelectedId] = useState(papers[0]?.id)
  const filters = ['全部', '待读', '在读', '精读', '已归档']
  const filtered = filter === '全部' ? papers : papers.filter((paper) => paper.status === filter)
  const selected = papers.find((paper) => paper.id === selectedId) || filtered[0] || papers[0]
  return (
    <div className="view">
      <PageHeading eyebrow="LIBRARY / 论文阅读" title="读过不算结束，能连接到问题才算。" description="按研究价值推进阅读，将批注、比较和假设放在同一条证据链中。" action={<button className="secondary-button" onClick={() => setToast('引用信息已导出')}>导出引用<FileText size={16} /></button>} />
      <div className="paper-toolbar">
        <div className="segmented-control" aria-label="论文状态筛选">
          {filters.map((item) => <button key={item} className={filter === item ? 'active' : ''} onClick={() => setFilter(item)}>{item}<span>{item === '全部' ? papers.length : papers.filter((paper) => paper.status === item).length}</span></button>)}
        </div>
        <button className="icon-text-button"><ListFilter size={16} />筛选</button>
      </div>
      <div className="library-layout">
        <section className="paper-library" aria-label="论文列表">
          <div className="library-header"><span>论文 / 来源</span><span>阅读进度</span><span>状态</span></div>
          {filtered.map((paper) => (
            <button key={paper.id} className={`library-row ${selected?.id === paper.id ? 'selected' : ''}`} onClick={() => setSelectedId(paper.id)}>
              <div className="library-title"><span className="document-icon"><FileText size={17} /></span><span><strong>{paper.title}</strong><small>{paper.venue} · {paper.tags.join(' / ')}</small></span></div>
              <div className="library-progress"><div className="progress-track"><i style={{ width: `${paper.progress}%` }} /></div><span>{paper.progress}%</span></div>
              <span className={`paper-status status-${paper.status}`}>{paper.status}</span>
            </button>
          ))}
          {!filtered.length && <div className="empty-state">当前状态下没有论文。</div>}
        </section>
        {selected && (
          <aside className="paper-detail">
            <div className="detail-top"><span className={`paper-status status-${selected.status}`}>{selected.status}</span><button className="icon-button subtle" aria-label="打开原文" title="打开原文"><ExternalLink size={17} /></button></div>
            <h2>{selected.title}</h2>
            <p className="venue-line">{selected.venue}</p>
            <div className="detail-progress"><span><strong>{selected.progress}%</strong> 阅读进度</span><div className="progress-track"><i style={{ width: `${selected.progress}%` }} /></div></div>
            <div className="detail-section"><span className="eyebrow">研究关联</span><h3>它回答了什么？</h3><p>如何用统一任务环境衡量智能体的规划、工具使用和长程决策能力。</p></div>
            <div className="detail-section note-section"><span className="eyebrow">最新笔记</span><p>{selected.note}</p></div>
            <div className="detail-tags">{selected.tags.map((tag) => <span key={tag}>{tag}</span>)}</div>
            <button className="primary-button full-button" onClick={() => setToast('阅读笔记已打开')}>继续阅读<ChevronRight size={16} /></button>
          </aside>
        )}
      </div>
    </div>
  )
}

function ExperimentsView({ experiments, setToast }) {
  const [selectedRun, setSelectedRun] = useState(experiments[0]?.id)
  return (
    <div className="view">
      <PageHeading eyebrow="LAB / 实验管理" title="让每个数字都能回到配置和假设。" description="追踪实验运行、核心指标和复现状态，减少结果与代码之间的断裂。" action={<button className="primary-button" onClick={() => setToast('新实验草稿已创建')}><Plus size={16} />新建实验</button>} />
      <div className="experiment-summary">
        <div><span className="summary-icon running"><Play size={16} fill="currentColor" /></span><small>运行中</small><strong>{experiments.filter((item) => item.status === '运行中').length}</strong></div>
        <div><span className="summary-icon complete"><Check size={17} /></span><small>本周完成</small><strong>6</strong></div>
        <div><span className="summary-icon queued"><Clock3 size={16} /></span><small>排队</small><strong>{experiments.filter((item) => item.status === '排队').length}</strong></div>
        <div><span className="summary-icon gpu"><Gauge size={16} /></span><small>GPU 利用率</small><strong>78%</strong></div>
      </div>
      <div className="experiment-layout">
        <section className="experiment-table">
          <div className="experiment-table-head"><span>实验</span><span>状态</span><span>核心指标</span><span>进度</span><span /></div>
          {experiments.map((run) => (
            <button className={`experiment-table-row ${selectedRun === run.id ? 'selected' : ''}`} key={run.id} onClick={() => setSelectedRun(run.id)}>
              <span className="experiment-name"><i>{run.id}</i><span><strong>{run.name}</strong><small>Seed {run.seed}</small></span></span>
              <span className={`status status-${run.status}`}>{run.status === '运行中' && <span className="live-dot" />}{run.status}</span>
              <span className="metric-cell"><strong>{run.metric}</strong><small className={run.change.startsWith('+') ? 'positive' : run.change.startsWith('-') ? 'negative' : ''}>{run.change}</small></span>
              <span className="table-progress"><span><i style={{ width: `${run.progress}%` }} /></span><small>{run.progress}%</small></span>
              <ChevronRight size={16} />
            </button>
          ))}
        </section>
        <RunDetail run={experiments.find((run) => run.id === selectedRun) || experiments[0]} setToast={setToast} />
      </div>
    </div>
  )
}

function RunDetail({ run, setToast }) {
  if (!run) return null
  return (
    <aside className="run-detail">
      <div className="detail-top"><span className="run-id">{run.id}</span><button className="icon-button subtle" aria-label="打开代码" title="打开代码"><GitBranch size={17} /></button></div>
      <h2>{run.name}</h2>
      <p>验证门控残差连接是否能在保持稳定性的同时提升跨任务表现。</p>
      <MiniRunChart />
      <dl className="config-list">
        <div><dt>模型</dt><dd>R-CFFA / base</dd></div>
        <div><dt>数据集</dt><dd>AgentBench-dev</dd></div>
        <div><dt>随机种子</dt><dd>{run.seed}</dd></div>
        <div><dt>配置</dt><dd>configs/{run.id.toLowerCase()}.yaml</dd></div>
      </dl>
      <div className="run-actions">
        <button className="secondary-button" onClick={() => setToast('运行日志已打开')}><FileText size={16} />查看日志</button>
        <button className="primary-button" onClick={() => setToast(run.status === '运行中' ? '实验已暂停' : '实验已加入队列')}>{run.status === '运行中' ? <Pause size={16} /> : <Play size={16} />} {run.status === '运行中' ? '暂停' : '运行'}</button>
      </div>
    </aside>
  )
}

function MiniRunChart() {
  return (
    <div className="run-chart">
      <div className="run-chart-label"><span>VALIDATION F1</span><strong>84.6</strong></div>
      <svg viewBox="0 0 320 110" role="img" aria-label="验证集 F1 随训练步数上升">
        <path className="grid-line" d="M10 25H310M10 55H310M10 85H310" />
        <path className="chart-line" d="M10 89 C38 87 48 75 72 76 S108 61 132 62 S168 45 190 48 S222 37 248 38 S278 29 310 31" />
        <circle cx="310" cy="31" r="4" />
      </svg>
      <div className="chart-axis"><span>0</span><span>2k</span><span>4k</span><span>6k steps</span></div>
    </div>
  )
}

function ArchiveView({ setToast }) {
  return (
    <div className="view">
      <PageHeading eyebrow="OUTPUT / 成果归档" title="只保存能复现、能引用、能继续推导的成果。" description="将关键结论、图表、代码和文档组织成可回溯的研究资产。" action={<button className="secondary-button" onClick={() => setToast('归档目录已同步')}><Archive size={16} />同步目录</button>} />
      <div className="archive-banner">
        <div><span className="eyebrow">CURRENT MILESTONE</span><h2>第一组消融实验形成稳定结论</h2><p>已连接 4 个实验、1 张主图与 2 条论文论证。</p></div>
        <div className="milestone-visual" aria-hidden="true"><span>Q</span><i /><span>P</span><i /><span>H</span><i /><span>E</span><i /><span className="active">C</span></div>
      </div>
      <div className="archive-toolbar"><div className="segmented-control"><button className="active">全部 <span>12</span></button><button>图表 <span>4</span></button><button>结论 <span>3</span></button><button>代码 <span>2</span></button><button>文档 <span>3</span></button></div><button className="icon-text-button"><ListFilter size={16} />按项目筛选</button></div>
      <div className="artifact-grid">
        {artifacts.map((item, index) => {
          const Icon = item.icon
          return (
            <article className="artifact-card" key={item.title}>
              <div className={`artifact-icon accent-${item.accent}`}><Icon size={20} /></div>
              <span className="artifact-type">{item.type} / 0{index + 1}</span>
              <h2>{item.title}</h2>
              <p>{item.meta}</p>
              {index === 0 && <MiniArtifactPlot />}
              {index === 1 && <blockquote>“性能提升主要来自中等难度任务，极端长程任务仍受上下文漂移影响。”</blockquote>}
              {index === 2 && <div className="code-lines"><span /><span /><span /><span /></div>}
              {index === 3 && <div className="matrix-preview"><span /><span /><span /><span /><span /><span /></div>}
              <button className="text-button" onClick={() => setToast(`已打开：${item.title}`)}>打开成果<ArrowUpRight size={15} /></button>
            </article>
          )
        })}
      </div>
    </div>
  )
}

function MiniArtifactPlot() {
  return <svg className="artifact-plot" viewBox="0 0 240 80" role="img" aria-label="门控系数与 F1 关系图"><path d="M10 67H232M10 10V67" /><path className="plot-main" d="M15 59 C50 54 68 36 96 31 S147 24 174 27 S210 39 228 48" /><circle cx="128" cy="25" r="4" /></svg>
}

function SearchDialog({ tasks, papers, experiments, onClose, changeView }) {
  const [query, setQuery] = useState('')
  const results = useMemo(() => {
    const normalized = query.trim().toLowerCase()
    const all = [
      ...tasks.map((item) => ({ title: item.title, meta: item.meta, type: '任务', view: 'learning', icon: CheckCircle2 })),
      ...papers.map((item) => ({ title: item.title, meta: `${item.venue} · ${item.status}`, type: '论文', view: 'papers', icon: BookOpen })),
      ...experiments.map((item) => ({ title: `${item.id} · ${item.name}`, meta: `${item.status} · ${item.metric}`, type: '实验', view: 'experiments', icon: FlaskConical })),
    ]
    return normalized ? all.filter((item) => `${item.title} ${item.meta}`.toLowerCase().includes(normalized)).slice(0, 8) : all.slice(0, 6)
  }, [query, tasks, papers, experiments])
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <div className="search-dialog" role="dialog" aria-modal="true" aria-label="搜索工作台" onMouseDown={(event) => event.stopPropagation()}>
        <div className="search-input"><Search size={20} /><input autoFocus value={query} onChange={(event) => setQuery(event.target.value)} placeholder="搜索论文、实验、任务或笔记" /><kbd>ESC</kbd></div>
        <div className="search-results">
          <span className="result-label">{query ? `搜索结果 · ${results.length}` : '最近访问'}</span>
          {results.map((item, index) => {
            const Icon = item.icon
            return <button key={`${item.type}-${item.title}-${index}`} onClick={() => { changeView(item.view); onClose() }}><span className="result-icon"><Icon size={17} /></span><span><strong>{item.title}</strong><small>{item.meta}</small></span><em>{item.type}</em><ChevronRight size={15} /></button>
          })}
          {!results.length && <div className="empty-state">没有找到匹配内容。</div>}
        </div>
        <div className="search-footer"><span><Command size={13} />K 打开搜索</span><span>↑↓ 选择</span><span>Enter 打开</span></div>
      </div>
    </div>
  )
}

function QuickAddDialog({ onClose, onAdd }) {
  const [type, setType] = useState('task')
  const [title, setTitle] = useState('')
  const [detail, setDetail] = useState('')
  const submit = (event) => {
    event.preventDefault()
    if (!title.trim()) return
    onAdd({ type, title: title.trim(), detail: detail.trim() })
  }
  return (
    <div className="modal-backdrop" onMouseDown={onClose}>
      <form className="quick-add-dialog" onSubmit={submit} onMouseDown={(event) => event.stopPropagation()}>
        <div className="dialog-heading"><div><span className="eyebrow">QUICK CAPTURE</span><h2>快速记录</h2></div><button type="button" className="icon-button" onClick={onClose} aria-label="关闭" title="关闭"><X size={19} /></button></div>
        <div className="type-selector">
          <button type="button" className={type === 'task' ? 'active' : ''} onClick={() => setType('task')}><CheckCircle2 size={17} />任务</button>
          <button type="button" className={type === 'paper' ? 'active' : ''} onClick={() => setType('paper')}><BookOpen size={17} />论文</button>
          <button type="button" className={type === 'experiment' ? 'active' : ''} onClick={() => setType('experiment')}><FlaskConical size={17} />实验</button>
        </div>
        <label><span>{type === 'task' ? '任务名称' : type === 'paper' ? '论文标题' : '实验名称'}</span><input autoFocus value={title} onChange={(event) => setTitle(event.target.value)} placeholder={type === 'task' ? '例如：整理实验误差案例' : type === 'paper' ? '输入论文标题' : '例如：跨域泛化测试'} /></label>
        <label><span>{type === 'task' ? '时间或说明' : type === 'paper' ? '来源或会议' : '运行安排'}</span><input value={detail} onChange={(event) => setDetail(event.target.value)} placeholder="可选" /></label>
        <div className="dialog-actions"><button type="button" className="secondary-button" onClick={onClose}>取消</button><button type="submit" className="primary-button" disabled={!title.trim()}><Plus size={16} />添加</button></div>
      </form>
    </div>
  )
}

function MobileNav({ activeView, changeView }) {
  return (
    <nav className="mobile-nav" aria-label="移动端主导航">
      {navItems.map((item) => {
        const Icon = item.icon
        return <button key={item.id} className={activeView === item.id ? 'active' : ''} onClick={() => changeView(item.id)}><Icon size={19} /><span>{item.label.replace('管理', '').replace('规划', '')}</span></button>
      })}
    </nav>
  )
}

function MobileMenu({ activeView, changeView, onClose, onHome }) {
  return (
    <div className="mobile-menu-backdrop" onClick={onClose}>
      <aside className="mobile-menu" onClick={(event) => event.stopPropagation()}>
        <div className="dialog-heading"><Brand onHome={onHome} /><button className="icon-button" onClick={onClose} aria-label="关闭导航" title="关闭导航"><X size={20} /></button></div>
        <nav>{navItems.map((item) => { const Icon = item.icon; return <button key={item.id} className={activeView === item.id ? 'active' : ''} onClick={() => changeView(item.id)}><Icon size={19} />{item.label}<ChevronRight size={16} /></button> })}</nav>
      </aside>
    </div>
  )
}

createRoot(document.getElementById('root')).render(<App />)
