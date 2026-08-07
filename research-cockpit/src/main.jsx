import React, { useEffect, useMemo, useRef, useState } from 'react'
import { createRoot } from 'react-dom/client'
import {
  Archive,
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
  Music2,
  Pause,
  PanelLeftClose,
  PanelLeftOpen,
  Play,
  Plus,
  Search,
  SkipBack,
  SkipForward,
  Sparkles,
  Target,
  X,
} from 'lucide-react'
import { isSupabaseConfigured, supabase } from './lib/supabase'
import {
  importLocalWorkspaceData,
  insertWorkspaceItem,
  loadAdminData,
  loadWorkspaceData,
  reviewAccessRequest,
  updateMemberStatus,
  updateWorkspaceItem,
} from './lib/workspaceData'
import './styles.css'

const ADMIN_SEED = {
  githubUsername: 'LGY123321LGY',
  email: 'lyin01864@gmail.com',
}

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

const initialLearningPhases = [
  { id: 1, title: '基础筑基', description: 'Agent 系统与评估方法', period: '2026.06 — 07', progress: 100, status: 'completed', sort_order: 1 },
  { id: 2, title: '方法实现', description: 'R-CFFA 方法实现与基线对齐', period: '2026.07 — 09', progress: 42, status: 'active', sort_order: 2 },
  { id: 3, title: '实验验证', description: '消融、泛化与误差分析', period: '2026.09 — 11', progress: 0, status: 'pending', sort_order: 3 },
  { id: 4, title: '总结产出', description: '证据整理与完整初稿', period: '2026.11 — 12', progress: 0, status: 'pending', sort_order: 4 },
]

const initialStudySessions = [
  { id: 1, started_at: '2026-08-05T14:00:00', ended_at: '2026-08-05T15:30:00', minutes: 90, notes: 'R-CFFA 特征聚合模块复现', phase_id: 2 },
  { id: 2, started_at: '2026-08-04T10:00:00', ended_at: '2026-08-04T11:00:00', minutes: 60, notes: '消融实验变量整理', phase_id: 2 },
  { id: 3, started_at: '2026-08-03T09:00:00', ended_at: '2026-08-03T10:30:00', minutes: 90, notes: 'R-CFFA 复现起步', phase_id: 2 },
  { id: 4, started_at: '2026-08-03T14:00:00', ended_at: '2026-08-03T14:45:00', minutes: 45, notes: 'AgentBench 精读', phase_id: 1 },
]

const initialResearchNotes = [
  { id: 1, title: 'W32 复盘', body: '完成：R-CFFA 模块 60%；AgentBench 精读完成；消融变量表整理。遇到：特征聚合层维度对齐偏差；多环境指标冲突。下一步：对齐评估协议；8/14 中期汇报。', tags: ['W32', '复盘'], created_at: '2026-08-05T18:00:00' },
  { id: 2, title: 'R-CFFA 维度偏差', body: '第 3 层聚合与原论文维度差 16，怀疑是 padding 位置不同，明天验证。', tags: ['R-CFFA', 'debug'], created_at: '2026-08-05T14:22:00' },
  { id: 3, title: 'AgentBench 指标冲突', body: '成功率与成本指标在多环境下冲突，需在汇报前澄清口径。', tags: ['AgentBench', '评估'], created_at: '2026-08-04T10:08:00' },
]

const lumoraVideos = [
  { label: 'Golden Hour', src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081127_0992a171-d3c6-4978-8213-0ec5df8b6d63.mp4' },
  { label: 'Still Water', src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_092026_dd05b805-ea0f-40b2-8c52-332b88502592.mp4' },
  { label: 'Deep Woods', src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_081042_df7202bf-bd80-4b2b-bbc6-1f09ba2870e9.mp4' },
  { label: 'Quiet Dawn', src: 'https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260702_080959_4cac5234-3573-464e-a5b7-76b94b8a7d61.mp4' },
]

const BACKGROUND_MUSIC_SRC = '/audio/background-music.mp3'

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
  admin: '#/admin',
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
  const [learningPhases, setLearningPhases] = usePersistentState('cockpit-learning-phases', initialLearningPhases)
  const [studySessions, setStudySessions] = usePersistentState('cockpit-study-sessions', initialStudySessions)
  const [researchNotes, setResearchNotes] = usePersistentState('cockpit-research-notes', initialResearchNotes)
  const [sidebarCollapsed, setSidebarCollapsed] = usePersistentState('cockpit-sidebar-collapsed', false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [quickAddOpen, setQuickAddOpen] = useState(false)
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false)
  const [toast, setToast] = useState('')
  const [session, setSession] = useState(null)
  const [authLoading, setAuthLoading] = useState(isSupabaseConfigured)
  const [memberProfile, setMemberProfile] = useState(null)
  const [workspaceLoading, setWorkspaceLoading] = useState(false)
  const [workspaceError, setWorkspaceError] = useState('')
  const [localImportAvailable, setLocalImportAvailable] = useState(false)

  useEffect(() => {
    if (!supabase) {
      setAuthLoading(false)
      return undefined
    }

    let disposed = false

    supabase.auth.getSession().then(({ data }) => {
      if (disposed) return
      setSession(data.session)
      setAuthLoading(false)
    })

    const { data: listener } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession)
      setAuthLoading(false)
    })

    return () => {
      disposed = true
      listener.subscription.unsubscribe()
    }
  }, [])

  useEffect(() => {
    if (!supabase || !session?.user) {
      setMemberProfile(null)
      return undefined
    }

    let disposed = false

    async function syncProfile() {
      const githubUsername =
        session.user.user_metadata?.user_name ||
        session.user.user_metadata?.preferred_username ||
        session.user.user_metadata?.name ||
        ''
      const email = session.user.email || ''
      const role = githubUsername.toLowerCase() === ADMIN_SEED.githubUsername.toLowerCase() && email.toLowerCase() === ADMIN_SEED.email.toLowerCase()
        ? 'admin'
        : 'member'
      const status = role === 'admin' ? 'approved' : 'pending'

      const { data, error } = await supabase
        .from('profiles')
        .upsert({
          id: session.user.id,
          email,
          github_username: githubUsername,
          display_name: session.user.user_metadata?.full_name || githubUsername || email,
          role,
          status,
          approved_at: status === 'approved' ? new Date().toISOString() : null,
        }, { onConflict: 'id' })
        .select()
        .single()

      if (disposed) return
      setMemberProfile(error ? { email, github_username: githubUsername, role, status: 'pending' } : data)
    }

    syncProfile()

    return () => {
      disposed = true
    }
  }, [session])

  const isApprovedMember = !isSupabaseConfigured || memberProfile?.status === 'approved'
  const isAdmin = memberProfile?.role === 'admin' && memberProfile?.status === 'approved'

  useEffect(() => {
    if (!supabase || !session?.user || !isApprovedMember) return undefined

    let disposed = false

    async function loadCloudWorkspace() {
      setWorkspaceLoading(true)
      setWorkspaceError('')
      try {
        const data = await loadWorkspaceData(supabase)
        if (disposed) return

        if (data.tasks.length) setTasks(data.tasks)
        if (data.papers.length) setPapers(data.papers)
        if (data.experiments.length) setExperiments(data.experiments)
        if (data.learningPhases?.length) setLearningPhases(data.learningPhases)
        if (data.studySessions?.length) setStudySessions(data.studySessions)
        if (data.researchNotes?.length) setResearchNotes(data.researchNotes)

        const hasLocalData = tasks.length > 0 || papers.length > 0 || experiments.length > 0
        const hasCloudData = data.tasks.length > 0 || data.papers.length > 0 || data.experiments.length > 0
        setLocalImportAvailable(hasLocalData && !hasCloudData)
      } catch (error) {
        if (!disposed) {
          setWorkspaceError(error.message || 'Failed to load cloud workspace.')
        }
      } finally {
        if (!disposed) setWorkspaceLoading(false)
      }
    }

    loadCloudWorkspace()

    return () => {
      disposed = true
    }
  }, [session, isApprovedMember])

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

  const importLocalDataToCloud = async () => {
    if (!supabase || !session?.user || !isApprovedMember) return
    setWorkspaceLoading(true)
    setWorkspaceError('')
    try {
      const imported = await importLocalWorkspaceData(supabase, session.user.id, { tasks, papers, experiments })
      if (imported.tasks.length) setTasks(imported.tasks)
      if (imported.papers.length) setPapers(imported.papers)
      if (imported.experiments.length) setExperiments(imported.experiments)
      setLocalImportAvailable(false)
      setToast('Local workspace imported to Supabase.')
    } catch (error) {
      setWorkspaceError(error.message || 'Import failed.')
      setToast('Import failed. Check Supabase policies.')
    } finally {
      setWorkspaceLoading(false)
    }
  }

  const toggleTask = async (taskId) => {
    const task = tasks.find((item) => item.id === taskId)
    setTasks((current) => current.map((task) => (task.id === taskId ? { ...task, done: !task.done } : task)))
    if (supabase && session?.user && isApprovedMember && task?.id) {
      try {
        await updateWorkspaceItem(supabase, 'tasks', task.id, { done: !task.done })
      } catch (error) {
        setTasks((current) => current.map((item) => (item.id === taskId ? { ...item, done: task.done } : item)))
        setToast(error.message || 'Cloud sync failed.')
      }
    }
  }

  const addLocalItem = ({ type, title, detail }) => {
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

  const addItem = async ({ type, title, detail }) => {
    if (!supabase || !session?.user || !isApprovedMember) {
      addLocalItem({ type, title, detail })
      return
    }

    const id = Date.now()
    const key = type === 'task' ? 'tasks' : type === 'paper' ? 'papers' : 'experiments'
    const nextItem = type === 'task'
      ? { id, title, meta: detail || 'New task · Pending', tag: 'Plan', done: false }
      : type === 'paper'
        ? { id, title, venue: detail || 'Source pending', status: 'to_read', progress: 0, tags: ['New'], note: 'No reading notes yet.' }
        : { id: `R-${String(experiments.length + 15).padStart(3, '0')}`, name: title, status: 'queued', metric: 'No result yet', change: '—', progress: 0, eta: detail || 'Waiting', seed: '0 / 5' }

    try {
      const saved = await insertWorkspaceItem(supabase, session.user.id, key, nextItem)
      if (type === 'task') setTasks((current) => [...current, saved])
      if (type === 'paper') setPapers((current) => [...current, saved])
      if (type === 'experiment') setExperiments((current) => [...current, saved])
      setQuickAddOpen(false)
      setToast('Saved to Supabase.')
    } catch (error) {
      setToast(error.message || 'Cloud save failed.')
    }
  }

  const viewProps = { tasks, papers, experiments, toggleTask, setToast, changeView, learningPhases, setLearningPhases, studySessions, setStudySessions, researchNotes, setResearchNotes, session, isApprovedMember }
  const isPortalView = activeView === 'home'
  const isProfileView = activeView === 'profile'
  const isPublicView = isPortalView || isProfileView
  const needsAuth = !isPublicView && isSupabaseConfigured && !authLoading && !session
  const needsApproval = !isPublicView && isSupabaseConfigured && !authLoading && session && memberProfile && !isApprovedMember

  return (
    <div className={`app-shell ${isPortalView ? 'portal-app' : ''} ${isProfileView ? 'profile-only-app' : ''} ${sidebarCollapsed ? 'sidebar-collapsed' : ''}`}>
      {activeView === 'home' && <PortalHome changeView={changeView} setToast={setToast} />}

      {!isPortalView && <>
        <CinematicWorkspaceBackground />
        {!isProfileView && <Sidebar activeView={activeView} changeView={changeView} onSearch={() => setSearchOpen(true)} onHome={() => changeView('home')} collapsed={sidebarCollapsed} onToggleCollapse={() => setSidebarCollapsed((current) => !current)} isAdmin={isAdmin} />}

        {!isProfileView && <header className="mobile-header">
          <button className="icon-button" onClick={() => setMobileMenuOpen(true)} aria-label="打开导航" title="打开导航">
            <Menu size={20} />
          </button>
          <Brand compact onHome={() => changeView('home')} />
          <button className="icon-button" onClick={() => setSearchOpen(true)} aria-label="搜索" title="搜索">
            <Search size={19} />
          </button>
        </header>}

        <main className="main-content">
          {!isProfileView && <TopBar onSearch={() => setSearchOpen(true)} onAdd={() => setQuickAddOpen(true)} session={session} memberProfile={memberProfile} setToast={setToast} />}
          {!isPublicView && authLoading && <AuthPanel mode="loading" />}
          {needsAuth && <AuthPanel mode="signin" setToast={setToast} />}
          {needsApproval && <AuthPanel mode="pending" memberProfile={memberProfile} />}
          {activeView === 'profile' ? <ProfilePage changeView={changeView} setToast={setToast} /> : !authLoading && !needsAuth && !needsApproval && <>
            {workspaceError && <WorkspaceNotice tone="danger" title="Cloud sync needs attention" description={workspaceError} />}
            {workspaceLoading && <WorkspaceNotice title="Syncing workspace" description="Loading your private Supabase workspace..." />}
            {localImportAvailable && <WorkspaceNotice title="Local data found" description="Your browser has local workspace data and Supabase is empty. Import it once to make it available after login." action={<button className="primary-button" onClick={importLocalDataToCloud}>Import to Supabase</button>} />}
            {activeView === 'dashboard' && <Dashboard {...viewProps} />}
            {activeView === 'learning' && <LearningView {...viewProps} />}
            {activeView === 'papers' && <PapersView {...viewProps} />}
            {activeView === 'experiments' && <ExperimentsView {...viewProps} />}
            {activeView === 'archive' && <ArchiveView {...viewProps} />}
            {activeView === 'admin' && isAdmin && <AdminView session={session} setToast={setToast} />}
          </>}
        </main>

        {!isProfileView && <MobileNav activeView={activeView} changeView={changeView} isAdmin={isAdmin} />}
        {!isProfileView && <button className="mobile-add-button" onClick={() => setQuickAddOpen(true)} aria-label="快速记录" title="快速记录">
          <Plus size={21} />
        </button>}
        {!isProfileView && mobileMenuOpen && <MobileMenu activeView={activeView} changeView={changeView} onClose={() => setMobileMenuOpen(false)} onHome={() => changeView('home')} />}
        {searchOpen && <SearchDialog tasks={tasks} papers={papers} experiments={experiments} onClose={() => setSearchOpen(false)} changeView={changeView} />}
        {quickAddOpen && <QuickAddDialog onClose={() => setQuickAddOpen(false)} onAdd={addItem} />}
      </>}
      {toast && <div className="toast" role="status"><CheckCircle2 size={17} />{toast}</div>}
    </div>
  )
}

function CinematicWorkspaceBackground() {
  return (
    <div className="workspace-cinema" aria-hidden="true">
      <video
        autoPlay
        loop
        muted
        playsInline
        preload="auto"
        poster="/images/hero_bg.png"
      >
        <source src="https://d8j0ntlcm91z4.cloudfront.net/user_38xzZboKViGWJOttwIXH07lWA1P/hf_20260306_115329_5e00c9c5-4d69-49b7-94c3-9c31c60bb644.mp4" type="video/mp4" />
      </video>
      <span className="workspace-cinema-overlay" />
      <span className="workspace-cinema-vignette" />
    </div>
  )
}

function MusicControl() {
  const audioRef = useRef(null)
  const playRequestRef = useRef(0)
  const [status, setStatus] = useState('loading')

  useEffect(() => {
    const audio = new Audio(BACKGROUND_MUSIC_SRC)
    let disposed = false

    audio.loop = true
    audio.volume = 0.35
    audio.preload = 'auto'
    audioRef.current = audio

    const onPlay = () => {
      if (!disposed) setStatus('playing')
    }
    const onPlaying = () => {
      if (!disposed) setStatus('playing')
    }
    const onPause = () => {
      if (!disposed && !audio.error) setStatus('paused')
    }
    const onEnded = () => {
      if (!disposed) setStatus('paused')
    }
    const onWaiting = () => {
      if (!disposed && !audio.paused) setStatus('loading')
    }
    const onError = () => {
      if (!disposed) setStatus('error')
    }

    audio.addEventListener('play', onPlay)
    audio.addEventListener('playing', onPlaying)
    audio.addEventListener('pause', onPause)
    audio.addEventListener('ended', onEnded)
    audio.addEventListener('waiting', onWaiting)
    audio.addEventListener('error', onError)

    const requestId = ++playRequestRef.current
    audio.play().catch((error) => {
      if (disposed || requestId !== playRequestRef.current) return
      setStatus(error?.name === 'NotAllowedError' || error?.name === 'AbortError' ? 'paused' : 'error')
    })

    return () => {
      disposed = true
      playRequestRef.current += 1
      audio.removeEventListener('play', onPlay)
      audio.removeEventListener('playing', onPlaying)
      audio.removeEventListener('pause', onPause)
      audio.removeEventListener('ended', onEnded)
      audio.removeEventListener('waiting', onWaiting)
      audio.removeEventListener('error', onError)
      audio.pause()
      audio.removeAttribute('src')
      audio.load()
      audioRef.current = null
    }
  }, [])

  const togglePlayback = () => {
    const audio = audioRef.current
    if (!audio || status === 'loading') return

    if (!audio.paused) {
      playRequestRef.current += 1
      audio.pause()
      return
    }

    const requestId = ++playRequestRef.current
    setStatus('loading')
    if (status === 'error') audio.load()
    audio.play().catch((error) => {
      if (requestId !== playRequestRef.current) return
      setStatus(error?.name === 'NotAllowedError' || error?.name === 'AbortError' ? 'paused' : 'error')
    })
  }

  const restartTrack = () => {
    const audio = audioRef.current
    if (!audio || status === 'loading') return

    audio.currentTime = 0
    if (!audio.paused) return

    const requestId = ++playRequestRef.current
    setStatus('loading')
    if (status === 'error') audio.load()
    audio.play().catch((error) => {
      if (requestId !== playRequestRef.current) return
      setStatus(error?.name === 'NotAllowedError' || error?.name === 'AbortError' ? 'paused' : 'error')
    })
  }

  const isPlaying = status === 'playing'
  const label = isPlaying ? '暂停背景音乐' : '播放背景音乐'
  const errorMessage = status === 'error' ? '背景音乐加载失败，请检查音频文件。' : ''

  return (
    <>
      <div className="music-control-dock">
        <button type="button" className="music-control__skip music-control__skip--previous" onClick={restartTrack} aria-label="上一曲" title="上一曲" disabled={status === 'loading'}>
          <SkipBack size={15} fill="currentColor" aria-hidden="true" />
        </button>
        <button
          type="button"
          className="music-control"
          data-state={status}
          onClick={togglePlayback}
          aria-label={label}
          aria-pressed={isPlaying}
          aria-busy={status === 'loading'}
          aria-describedby={status === 'error' ? 'background-music-error' : undefined}
          title={label}
          disabled={status === 'loading'}
        >
          <span className="music-control__particles" aria-hidden="true"><i /><i /><i /><i /></span>
          <span className="music-control__stage" aria-hidden="true">
            <span className="music-control__icon music-control__icon--music"><Music2 className="music-control__spinner" size={18} /></span>
            <span className="music-control__icon music-control__icon--pause"><Pause size={18} /></span>
            <span className="music-control__icon music-control__icon--play"><Play size={18} fill="currentColor" /></span>
          </span>
        </button>
        <button type="button" className="music-control__skip music-control__skip--next" onClick={restartTrack} aria-label="下一曲" title="下一曲" disabled={status === 'loading'}>
          <SkipForward size={15} fill="currentColor" aria-hidden="true" />
        </button>
      </div>
      <span id="background-music-error" className="music-control__sr-only" role="status" aria-live="polite">{errorMessage}</span>
    </>
  )
}

function PortalHome({ changeView, setToast }) {
  const [activeVideo, setActiveVideo] = useState(0)
  const [isTransitioning, setIsTransitioning] = useState(false)
  const [menuOpen, setMenuOpen] = useState(false)
  const [email, setEmail] = useState('')
  const transitionTimer = useRef(null)
  const isDarkScene = activeVideo === 2

  useEffect(() => () => window.clearTimeout(transitionTimer.current), [])

  useEffect(() => {
    if (!menuOpen) return undefined
    const closeOnEscape = (event) => {
      if (event.key === 'Escape') setMenuOpen(false)
    }
    window.addEventListener('keydown', closeOnEscape)
    return () => window.removeEventListener('keydown', closeOnEscape)
  }, [menuOpen])

  const handleNavigate = (view) => {
    setMenuOpen(false)
    changeView(view)
  }

  const selectVideo = (index) => {
    if (index === activeVideo || isTransitioning) return
    setActiveVideo(index)
    setIsTransitioning(true)
    transitionTimer.current = window.setTimeout(() => setIsTransitioning(false), 1000)
  }

  const submitEmail = async (event) => {
    event.preventDefault()
    if (!event.currentTarget.reportValidity()) return
    if (supabase) {
      const { error } = await supabase
        .from('access_requests')
        .insert({ email, status: 'pending', source: 'homepage' })
      setToast(error ? 'Request saved locally until access table is ready.' : 'Access request received.')
    } else {
      setToast('You are on the early access list.')
    }
    setEmail('')
  }

  return (
    <main className={`lumora-hero ${isDarkScene ? 'lumora-dark-scene' : ''}`}>
      <div className="lumora-media" aria-hidden="true">
        {lumoraVideos.map((video, index) => <video key={video.src} className={index === activeVideo ? 'is-active' : ''} src={video.src} autoPlay muted loop playsInline preload={index === 0 ? 'auto' : 'metadata'} />)}
      </div>
      <img className="lumora-train-overlay" src="https://soft-zoom-63098134.figma.site/_assets/v11/0b4a435b2df2747593c43d7a1c9b4578f7d8d90c.png" alt="" aria-hidden="true" />
      <div className="lumora-scrim" aria-hidden="true" />

      <div className="lumora-content">
        <header className="lumora-nav">
          <button className="lumora-logo" onClick={() => handleNavigate('home')} aria-label="Welcome~ 首页">Welcome~</button>
          <div className="lumora-nav-actions liquid-glass">
            <nav className="lumora-desktop-nav" aria-label="主导航">
              <button onClick={() => handleNavigate('dashboard')}>总览</button>
              <button onClick={() => handleNavigate('learning')}>学习规划</button>
              <button onClick={() => handleNavigate('papers')}>论文阅读</button>
              <button onClick={() => handleNavigate('experiments')}>实验管理</button>
              <button onClick={() => handleNavigate('archive')}>成果归档</button>
              <button onClick={() => handleNavigate('profile')}>个人资料</button>
            </nav>
            <MusicControl />
          </div>
        </header>

        <section className="lumora-center" aria-labelledby="lumora-title">
          <div className="lumora-hero-copy">
            <h1 id="lumora-title">光阴如梭 珍惜眼下</h1>
            <p>Turn inward, and let life flourish.</p>
            <form className="lumora-access liquid-glass" onSubmit={submitEmail}>
              <label className="sr-only" htmlFor="lumora-email">Your Best Email</label>
              <input id="lumora-email" type="email" value={email} onChange={(event) => setEmail(event.target.value)} placeholder="Your Best Email" required />
              <button type="submit">Get Early Access</button>
            </form>
          </div>
          <div className="lumora-video-switcher" aria-label="Choose an atmosphere">
            {lumoraVideos.map((video, index) => <button key={video.label} className={index === activeVideo ? 'active' : ''} onClick={() => selectVideo(index)} aria-pressed={index === activeVideo} disabled={isTransitioning && index !== activeVideo}>{video.label}</button>)}
          </div>
        </section>

        <footer className="lumora-stats" aria-label="Lumora statistics">
          <span>60+ Deep Sessions</span><i aria-hidden="true">|</i><span>12,000+ Creators</span><i aria-hidden="true">|</i><span>4.8 User Satisfaction</span><i aria-hidden="true">|</i><span>Intentional-First Design</span>
        </footer>
      </div>

      <button className={`lumora-menu-toggle liquid-glass ${menuOpen ? 'is-open' : ''}`} onClick={() => setMenuOpen((current) => !current)} aria-label={menuOpen ? '关闭菜单' : '打开菜单'} aria-expanded={menuOpen}>
        <span className="lumora-menu-icon"><Menu size={21} /><X size={21} /></span>
      </button>

      {menuOpen && <div className="lumora-mobile-menu" onMouseDown={() => setMenuOpen(false)}>
        <div className="lumora-mobile-panel" onMouseDown={(event) => event.stopPropagation()}>
          <span className="lumora-mobile-wordmark">Welcome~</span>
          <nav aria-label="移动端主导航">
            <button onClick={() => handleNavigate('dashboard')}>总览</button>
            <button onClick={() => handleNavigate('learning')}>学习规划</button>
            <button onClick={() => handleNavigate('papers')}>论文阅读</button>
            <button onClick={() => handleNavigate('experiments')}>实验管理</button>
            <button onClick={() => handleNavigate('archive')}>成果归档</button>
            <button onClick={() => handleNavigate('profile')}>个人资料</button>
          </nav>
          <button className="lumora-mobile-cta" onClick={() => handleNavigate('dashboard')}>Get Started <ArrowRight size={18} /></button>
        </div>
      </div>}
    </main>
  )
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
    <div className="view profile-workspace-view">
      <PageHeading
        eyebrow="PROFILE / RESEARCH SPACE"
        title={profile.name}
        description={profile.introduction}
        action={<div className="profile-heading-actions"><button className="secondary-button" onClick={() => changeView('home')}><Home size={16} />返回首页</button><button className="primary-button" onClick={() => changeView('dashboard')}><LayoutDashboard size={16} />查看总览</button></div>}
      />

      <div className="profile-workspace-grid">
        <section className="panel profile-focus-panel">
          <SectionHeader title="研究方向" meta="FOCUS AREAS" icon={Target} />
          <div className="profile-panel-content">
            <p className="profile-role">{profile.role}</p>
            <h2>正在持续构建的能力</h2>
            <div className="profile-focus-list">{profile.focus.map((item, index) => <span key={item}><i>{String(index + 1).padStart(2, '0')}</i>{item}</span>)}</div>
          </div>
        </section>

        <section className="panel profile-contact-panel">
          <SectionHeader title="联系方式" meta="CONTACT" icon={Mail} />
          <div className="profile-panel-content profile-contact-content">
            <span className="profile-field-label">EMAIL</span>
            <strong>{profile.email}</strong>
            <button className="icon-text-button" onClick={copyEmail}><Copy size={16} />复制邮箱</button>
          </div>
        </section>

        <section className="panel profile-repository-panel">
          <SectionHeader title="GitHub 仓库" meta="PROJECTS" icon={Github} />
          <div className="profile-panel-content profile-repository-content">
            <Github size={30} aria-hidden="true" />
            <div><span className="profile-field-label">REPOSITORY</span><h2>{profile.githubLabel}</h2></div>
            {profile.githubUrl ? <a className="icon-text-button" href={profile.githubUrl} target="_blank" rel="noreferrer">访问仓库 <ArrowUpRight size={16} /></a> : <span className="profile-empty-state">仓库地址待设置</span>}
          </div>
        </section>
      </div>
    </div>
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

function WorkspaceNotice({ title, description, action, tone = 'info' }) {
  return (
    <section className={`workspace-notice workspace-notice-${tone}`}>
      <div>
        <strong>{title}</strong>
        <p>{description}</p>
      </div>
      {action}
    </section>
  )
}

function AdminView({ session, setToast }) {
  const [loading, setLoading] = useState(true)
  const [requests, setRequests] = useState([])
  const [profiles, setProfiles] = useState([])
  const [error, setError] = useState('')

  const refresh = async () => {
    if (!supabase) return
    setLoading(true)
    setError('')
    try {
      const data = await loadAdminData(supabase)
      setRequests(data.requests)
      setProfiles(data.profiles)
    } catch (nextError) {
      setError(nextError.message || 'Failed to load admin data.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    refresh()
  }, [])

  const reviewRequest = async (requestId, status) => {
    try {
      await reviewAccessRequest(supabase, requestId, status, session.user.id)
      await refresh()
      setToast(`Request ${status}.`)
    } catch (nextError) {
      setToast(nextError.message || 'Request update failed.')
    }
  }

  const changeMemberStatus = async (profileId, status) => {
    try {
      await updateMemberStatus(supabase, profileId, status, session.user.id)
      await refresh()
      setToast(`Member ${status}.`)
    } catch (nextError) {
      setToast(nextError.message || 'Member update failed.')
    }
  }

  return (
    <div className="view admin-view">
      <PageHeading
        eyebrow="ADMIN / SUPABASE"
        title="Workspace access control"
        description="Approve access requests, manage member status, and keep every action protected by Supabase RLS."
        action={<button className="secondary-button" onClick={refresh} disabled={loading}>Refresh</button>}
      />
      {error && <WorkspaceNotice tone="danger" title="Admin data failed to load" description={error} />}
      <div className="admin-grid">
        <section className="panel admin-panel">
          <SectionHeader title="Access requests" meta={`${requests.length} total`} icon={Mail} />
          <div className="admin-list">
            {requests.map((request) => (
              <article className="admin-row" key={request.id}>
                <div>
                  <strong>{request.github_username || 'GitHub pending'}</strong>
                  <small>{request.email} · {request.status}</small>
                </div>
                <div className="admin-actions">
                  <button className="secondary-button" onClick={() => reviewRequest(request.id, 'rejected')} disabled={request.status === 'rejected'}>Reject</button>
                  <button className="primary-button" onClick={() => reviewRequest(request.id, 'approved')} disabled={request.status === 'approved'}>Approve</button>
                </div>
              </article>
            ))}
            {!loading && !requests.length && <div className="empty-state">No access requests yet.</div>}
            {loading && <div className="empty-state">Loading requests...</div>}
          </div>
        </section>

        <section className="panel admin-panel">
          <SectionHeader title="Members" meta={`${profiles.length} profiles`} icon={Github} />
          <div className="admin-list">
            {profiles.map((profileRow) => (
              <article className="admin-row" key={profileRow.id}>
                <div>
                  <strong>{profileRow.github_username || profileRow.display_name || profileRow.email}</strong>
                  <small>{profileRow.email} · {profileRow.role} · {profileRow.status}</small>
                </div>
                <div className="admin-actions">
                  <button className="secondary-button" onClick={() => changeMemberStatus(profileRow.id, 'suspended')} disabled={profileRow.status === 'suspended'}>Suspend</button>
                  <button className="primary-button" onClick={() => changeMemberStatus(profileRow.id, 'approved')} disabled={profileRow.status === 'approved'}>Approve</button>
                </div>
              </article>
            ))}
            {!loading && !profiles.length && <div className="empty-state">No profiles yet.</div>}
            {loading && <div className="empty-state">Loading members...</div>}
          </div>
        </section>
      </div>
    </div>
  )
}

function Sidebar({ activeView, changeView, onSearch, onHome, collapsed, onToggleCollapse, isAdmin = false }) {
  const visibleNavItems = isAdmin ? [...navItems, { id: 'admin', label: 'Admin', icon: Github }] : navItems
  return (
    <aside className="sidebar">
      <div className="sidebar-brand-row">
        <Brand onHome={onHome} />
        <button className="sidebar-collapse-button" onClick={onToggleCollapse} aria-label={collapsed ? '展开导航栏' : '收起导航栏'} title={collapsed ? '展开导航栏' : '收起导航栏'}>
          {collapsed ? <PanelLeftOpen size={18} /> : <PanelLeftClose size={18} />}
        </button>
      </div>
      <nav className="side-nav" aria-label="主导航">
        {visibleNavItems.map((item) => {
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

function AuthPanel({ mode, setToast, memberProfile }) {
  const signInWithGitHub = async () => {
    if (!supabase) {
      setToast('Supabase is not configured yet.')
      return
    }

    const { error } = await supabase.auth.signInWithOAuth({
      provider: 'github',
      options: {
        redirectTo: window.location.origin + window.location.pathname,
        scopes: 'read:user user:email',
      },
    })

    if (error) setToast(error.message)
  }

  return (
    <section className="auth-panel">
      <div>
        <span className="eyebrow">{mode === 'loading' ? 'AUTH / LOADING' : mode === 'pending' ? 'AUTH / WAITING APPROVAL' : 'AUTH / PRIVATE WORKSPACE'}</span>
        <h1>{mode === 'loading' ? 'Checking your workspace access' : mode === 'pending' ? 'Your account is waiting for approval' : 'Sign in to enter your research cockpit'}</h1>
        <p>{mode === 'loading' ? 'Supabase is preparing your session.' : mode === 'pending' ? `Signed in as ${memberProfile?.github_username || memberProfile?.email || 'this GitHub account'}. An admin needs to approve this profile before workspace data can be opened.` : 'Use the approved GitHub account to keep research tasks, papers, and experiments tied to your private cloud workspace.'}</p>
      </div>
      {mode !== 'loading' && <button className="primary-button" onClick={signInWithGitHub}><Github size={17} /> Continue with GitHub</button>}
    </section>
  )
}

function TopBar({ onSearch, onAdd, session, memberProfile, setToast }) {
  const signOut = async () => {
    if (!supabase) return
    await supabase.auth.signOut()
    setToast('Signed out.')
  }

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
        {session && <button className="secondary-button auth-chip" onClick={signOut} title="Sign out"><Github size={16} />{memberProfile?.role || 'member'}</button>}
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

function LearningView({ tasks, toggleTask, setToast, learningPhases, studySessions, researchNotes, setResearchNotes, session, isApprovedMember }) {
  const [drawerPhase, setDrawerPhase] = useState(null)
  const [drawerTab, setDrawerTab] = useState('tasks')
  const [reflectionOpen, setReflectionOpen] = useState(false)
  const [draggingId, setDraggingId] = useState(null)
  const [dropTarget, setDropTarget] = useState(null)

  const phases = learningPhases.length ? learningPhases : initialLearningPhases
  const activePhase = phases.find((p) => p.status === 'active') || phases[1] || phases[0]

  const weekMinutes = (studySessions.length ? studySessions : initialStudySessions)
    .filter((s) => s.started_at?.startsWith('2026-08'))
    .reduce((sum, s) => sum + (s.minutes || 0), 0)
  const totalProgress = Math.round(phases.reduce((sum, p) => sum + (p.progress || 0), 0) / phases.length)

  const doingTasks = tasks.filter((t) => !t.done && (t.tag === '代码' || t.tag === '实验'))
  const queuedTasks = tasks.filter((t) => !t.done && !doingTasks.includes(t))
  const doneTasks = tasks.filter((t) => t.done)

  const handleDragStart = (id) => setDraggingId(id)
  const handleDragEnd = () => { setDraggingId(null); setDropTarget(null) }
  const handleDrop = (col) => {
    if (!draggingId) return
    const task = tasks.find((t) => t.id === draggingId)
    if (!task) return
    if (col === 'done' && !task.done) toggleTask(task.id)
    if (col !== 'done' && task.done) toggleTask(task.id)
    setDraggingId(null); setDropTarget(null)
  }

  const weekDays = [
    { day: '一', date: '03', blocks: [{ label: "90' R-CFFA", type: 'orange' }, { label: "45' AgentBench", type: 'blue' }] },
    { day: '二', date: '04', blocks: [{ label: "60' 消融整理", type: 'green' }] },
    { day: '三', date: '05', blocks: [{ label: "90' R-CFFA 复现", type: 'orange' }, { label: "30' 阶段复盘", type: 'blue' }], today: true },
    { day: '四', date: '06', blocks: [{ label: "45' 论文精读", type: 'blue' }] },
    { day: '五', date: '07', blocks: [] },
    { day: '六', date: '08', blocks: [] },
    { day: '日', date: '09', blocks: [] },
  ]

  const latestNote = (researchNotes.length ? researchNotes : initialResearchNotes)[0]

  return (
    <div className="view learning-view">
      <div className="learning-page-head">
        <div>
          <h1 className="learning-title">Learning <span className="cn">规划</span></h1>
          <p className="learning-sub">研究学习的协调中枢 · 周节奏 · 路线 · 复盘</p>
        </div>
        <div className="learning-head-actions">
          <button className="lg-btn lg-btn-ghost" onClick={() => setDrawerPhase(activePhase)}>
            <Map size={14} />当前阶段
          </button>
          <button className="lg-btn lg-btn-primary" onClick={() => setReflectionOpen(true)}>
            <Sparkles size={14} />完成专注 · 写复盘
          </button>
        </div>
      </div>

      <div className="learning-kpi-strip">
        <div className="liquid-glass lg-kpi">
          <span className="lg-kpi-label">本周专注</span>
          <span className="lg-kpi-value">{(weekMinutes / 60).toFixed(1)}<span className="lg-kpi-unit">h</span></span>
          <span className="lg-kpi-delta up">▲ 较上周 +{(weekMinutes / 60 * 0.17).toFixed(1)}h</span>
          <svg className="lg-kpi-spark" width="56" height="20"><polyline fill="none" stroke="#789bc5" strokeWidth="1.5" points="0,14 8,10 16,12 24,6 32,8 40,4 48,7 56,2" /></svg>
        </div>
        <div className="liquid-glass lg-kpi">
          <span className="lg-kpi-label">路线总进度</span>
          <span className="lg-kpi-value">{totalProgress}<span className="lg-kpi-unit">%</span></span>
          <span className="lg-kpi-delta up">▲ {phases.filter((p) => p.progress >= 100).length} / {phases.length} 阶段</span>
          <svg className="lg-kpi-spark" width="56" height="20"><polyline fill="none" stroke="#6fae8e" strokeWidth="1.5" points="0,16 14,14 28,10 42,8 56,5" /></svg>
        </div>
        <div className="liquid-glass lg-kpi">
          <span className="lg-kpi-label">距下一检查点</span>
          <span className="lg-kpi-value">9<span className="lg-kpi-unit">天</span></span>
          <span className="lg-kpi-delta">阶段 02 · 中期汇报</span>
          <svg className="lg-kpi-spark" width="56" height="20"><circle cx="28" cy="10" r="6" fill="none" stroke="#789bc5" strokeWidth="1.5" /><line x1="28" y1="10" x2="28" y2="5" stroke="#789bc5" strokeWidth="1.5" /><line x1="28" y1="10" x2="32" y2="10" stroke="#789bc5" strokeWidth="1.5" /></svg>
        </div>
      </div>

      <section className="liquid-glass lg-panel">
        <div className="lg-panel-head">
          <CalendarDays size={16} />
          <h2>本周日历 · 时间块</h2>
          <span className="lg-panel-tag">2026-W32</span>
        </div>
        <div className="lg-panel-body">
          <div className="lg-cal-grid">
            {weekDays.map((d) => (
              <div key={d.date} className={`lg-cal-cell ${d.today ? 'today' : ''}`}>
                <span className="lg-cal-day">{d.date}{d.today ? ' · 今天' : ''}</span>
                <div className="lg-cal-blocks">
                  {d.blocks.map((b, i) => (
                    <span key={i} className={`lg-cal-block lg-block-${b.type}`}>{b.label}</span>
                  ))}
                </div>
              </div>
            ))}
          </div>
          <div className="lg-cal-trend">
            <span>近 30 天专注趋势</span>
            <svg className="lg-sparkline" viewBox="0 0 600 24" preserveAspectRatio="none">
              <defs><linearGradient id="lg" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#789bc5" stopOpacity=".35" /><stop offset="1" stopColor="#789bc5" stopOpacity="0" /></linearGradient></defs>
              <path d="M0,18 L60,12 L120,14 L180,8 L240,10 L300,5 L360,7 L420,4 L480,8 L540,3 L600,5 L600,24 L0,24 Z" fill="url(#lg)" />
              <path d="M0,18 L60,12 L120,14 L180,8 L240,10 L300,5 L360,7 L420,4 L480,8 L540,3 L600,5" fill="none" stroke="#789bc5" strokeWidth="1.4" />
            </svg>
            <span style={{ color: 'var(--sky, #789bc5)' }}>+{(weekMinutes / 60).toFixed(1)}h 本周</span>
          </div>
        </div>
      </section>

      <div className="lg-dual">
        <section className="liquid-glass lg-panel">
          <div className="lg-panel-head">
            <Map size={16} />
            <h2>研究学习路线</h2>
            <span className="lg-panel-tag">4 PHASES</span>
          </div>
          <div className="lg-panel-body">
            <div className="lg-roadmap-track">
              {phases.map((p, i) => (
                <div key={p.id} className={`lg-phase lg-phase-${p.status}`} onClick={() => { setDrawerPhase(p); setDrawerTab('tasks') }}>
                  <span className="lg-phase-node">{String(i + 1).padStart(2, '0')}</span>
                  <span className="lg-phase-title">{p.title}</span>
                  <span className="lg-phase-meta">{p.period} · {p.progress}%</span>
                  <span className="lg-phase-bar"><i style={{ width: `${p.progress}%` }} /></span>
                </div>
              ))}
            </div>
            <div className="lg-roadmap-detail">
              <strong>当前 · 阶段 02 · {activePhase?.title}</strong> —— {activePhase?.description}。下一检查点：<strong>8/14 中期汇报</strong>。
            </div>
          </div>
        </section>

        <section className="liquid-glass lg-panel">
          <div className="lg-panel-head">
            <ListFilter size={16} />
            <h2>本周任务</h2>
            <span className="lg-panel-tag">DRAGGABLE</span>
          </div>
          <div className="lg-panel-body">
            <div className="lg-kanban">
              {[
                { col: 'doing', label: '进行中', items: doingTasks },
                { col: 'queued', label: '排队', items: queuedTasks },
                { col: 'done', label: '已完成', items: doneTasks },
              ].map((column) => (
                <div
                  key={column.col}
                  className={`lg-kanban-col ${dropTarget === column.col ? 'drop-target' : ''}`}
                  onDragOver={(e) => { e.preventDefault(); setDropTarget(column.col) }}
                  onDragLeave={() => setDropTarget(null)}
                  onDrop={(e) => { e.preventDefault(); handleDrop(column.col) }}
                >
                  <div className="lg-kanban-head">
                    <span>{column.label}</span>
                    <span className="lg-kanban-count">{column.items.length}</span>
                  </div>
                  {column.items.map((task) => (
                    <div
                      key={task.id}
                      className={`lg-task ${draggingId === task.id ? 'dragging' : ''} lg-task-${column.col}`}
                      draggable
                      onDragStart={() => handleDragStart(task.id)}
                      onDragEnd={handleDragEnd}
                    >
                      <span className="lg-task-title">{task.title}</span>
                      <span className="lg-task-meta">
                        <span className={`lg-task-tag lg-tag-${(task.tag || '').toLowerCase()}lg-tag`}>{task.tag}</span>
                        <span>{task.meta?.split('·').pop()?.trim() || ''}</span>
                      </span>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          </div>
        </section>
      </div>

      <section className="liquid-glass lg-panel">
        <div className="lg-panel-head">
          <Sparkles size={16} />
          <h2>每周复盘</h2>
          <span className="lg-panel-tag">W32 · 2026</span>
        </div>
        <div className="lg-panel-body">
          <div className="lg-reflection">
            <div className="lg-r-col lg-r-week">
              <span className="lg-r-label">本周</span>
              <span className="lg-r-week-num">W32</span>
              <span className="lg-r-week-range">2026.08.03 — 08.09</span>
            </div>
            <div className="lg-r-col">
              <span className="lg-r-label">完成什么</span>
              <span className="lg-r-body">复现 R-CFFA 模块 60%；AgentBench 实验设计精读完成；消融实验变量表整理。</span>
            </div>
            <div className="lg-r-col">
              <span className="lg-r-label">遇到什么</span>
              <span className="lg-r-body">特征聚合层与原论文维度对齐有偏差；多环境指标在 AgentBench 出现冲突，待澄清。</span>
            </div>
            <div className="lg-r-col">
              <span className="lg-r-label">下一步</span>
              <span className="lg-r-body">8/10-13 对齐评估协议；8/14 中期汇报；启动阶段 03 实验设计草稿。</span>
            </div>
          </div>
        </div>
      </section>

      {drawerPhase && (
        <>
          <div className="lg-drawer-mask" onClick={() => setDrawerPhase(null)} />
          <aside className="liquid-glass lg-drawer" role="dialog" aria-modal="true" aria-label="阶段详情">
            <div className="lg-drawer-head">
              <div>
                <h3>{drawerPhase.title}</h3>
                <span className="lg-phase-tag">PHASE {String(phases.indexOf(drawerPhase) + 1).padStart(2, '0')} · {drawerPhase.status === 'active' ? '进行中' : drawerPhase.status === 'completed' ? '已完成' : '未开始'}</span>
              </div>
              <button className="lg-drawer-close" onClick={() => setDrawerPhase(null)} aria-label="关闭"><X size={14} /></button>
            </div>
            <div className="lg-drawer-tabs">
              {['tasks', 'notes', 'sessions'].map((tab) => (
                <button key={tab} className={`lg-drawer-tab ${drawerTab === tab ? 'active' : ''}`} onClick={() => setDrawerTab(tab)}>
                  {tab === 'tasks' ? '任务' : tab === 'notes' ? '笔记' : '专注记录'}
                </button>
              ))}
            </div>
            <div className="lg-drawer-body">
              {drawerTab === 'tasks' && (
                <div className="lg-drawer-section">
                  <h4>关联任务</h4>
                  {tasks.map((task) => (
                    <div key={task.id} className={`lg-drawer-task ${task.done ? 'done' : ''}`}>
                      <span className="lg-check">{task.done && <Check size={10} />}</span>
                      <span>{task.title}</span>
                    </div>
                  ))}
                </div>
              )}
              {drawerTab === 'notes' && (
                <div className="lg-drawer-section">
                  <h4>研究笔记</h4>
                  {(researchNotes.length ? researchNotes : initialResearchNotes).map((note) => (
                    <div key={note.id} className="lg-drawer-note">
                      <div className="lg-note-meta">{note.created_at?.slice(0, 16).replace('T', ' · ')}</div>
                      {note.body}
                    </div>
                  ))}
                </div>
              )}
              {drawerTab === 'sessions' && (
                <div className="lg-drawer-section">
                  <h4>本周专注</h4>
                  {(studySessions.length ? studySessions : initialStudySessions).map((s) => (
                    <div key={s.id} className="lg-drawer-note">
                      <div className="lg-note-meta">{s.started_at?.slice(0, 10)} · {s.minutes} min</div>
                      {s.notes}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </aside>
        </>
      )}

      {reflectionOpen && (
        <div className="lg-dialog-mask" onClick={() => setReflectionOpen(false)}>
          <div className="liquid-glass lg-dialog" role="dialog" aria-modal="true" aria-label="专注后复盘" onClick={(e) => e.stopPropagation()}>
            <h3>专注复盘</h3>
            <p className="lg-dialog-sub">刚刚完成一段专注，记录这一程的收获与下一步。</p>
            <ReflectionForm onSave={(data) => {
              const newNote = { id: Date.now(), title: `W32 复盘 · ${new Date().toLocaleDateString('zh-CN')}`, body: `完成：${data.done}\n遇到：${data.issue}\n下一步：${data.next}`, tags: ['W32', '复盘'], created_at: new Date().toISOString() }
              setResearchNotes((prev) => [newNote, ...prev])
              setToast('复盘笔记已保存')
              setReflectionOpen(false)
            }} onClose={() => setReflectionOpen(false)} />
          </div>
        </div>
      )}
    </div>
  )
}

function ReflectionForm({ onSave, onClose }) {
  const [done, setDone] = useState('')
  const [issue, setIssue] = useState('')
  const [next, setNext] = useState('')
  return (
    <div className="lg-reflection-form">
      <label>完成了什么</label>
      <textarea value={done} onChange={(e) => setDone(e.target.value)} placeholder="例如：R-CFFA 第 3 层聚合维度对齐，padding 改为 same。" />
      <label>遇到什么</label>
      <textarea value={issue} onChange={(e) => setIssue(e.target.value)} placeholder="例如：原论文公式 (3) 的 σ 范围未指明，需查附录。" />
      <label>下一步</label>
      <textarea value={next} onChange={(e) => setNext(e.target.value)} placeholder="例如：明天对齐评估协议并写消融表草稿。" />
      <div className="lg-dialog-actions">
        <button className="lg-btn lg-btn-ghost" onClick={onClose}>稍后</button>
        <button className="lg-btn lg-btn-primary" onClick={() => onSave({ done, issue, next })}>保存为复盘笔记</button>
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

function MobileNav({ activeView, changeView, isAdmin = false }) {
  const visibleNavItems = isAdmin ? [...navItems, { id: 'admin', label: 'Admin', icon: Github }] : navItems
  return (
    <nav className="mobile-nav" aria-label="移动端主导航">
      {visibleNavItems.map((item) => {
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
