import { defineStore } from 'pinia'
import { watch } from 'vue'
import { AnswerState, type JeopardyData } from '~/utils/jeopardy/types'

export const useJeopardyStore = defineStore('jeopardy', () => {
  const router = useRouter()
  const route = useRoute()
  const { data: jdata, status, error, refresh: refreshData } = useFetch<JeopardyData>(`/api/jeopardy/data/${route.params.id}`)
  const users = computed(() => jdata.value?.participants)
  const currentUser = ref('')
  const currentQuestion: Ref<{ category: string, points: number } | undefined> = ref(undefined)
  const questionRevealed = ref(false)
  const answerState = ref(AnswerState.Unanswered)

  const unsavedChanges = ref(false)



  function toggleJokerFromUser(user: string, joker: string) {
    const userdata = users.value
    if (!userdata) return
    const jokers = userdata[user].jokers
    const jokerIndex = jokers.indexOf(joker)
    if (jokerIndex === -1) {
      jokers.push(joker)
      return
    }
    jokers.splice(jokerIndex, 1)
  }

  function addPointsToUser(user: string, points: number) {
    const userdata = users.value
    if (!userdata) return
    userdata[user].points += points
  }

  function nextPlayerAndMainPage() {
    if (!users.value) return
    const userKeys = Object.keys(users.value)
    const currentUserIndex = userKeys.indexOf(currentUser.value)
    currentUser.value = userKeys[(currentUserIndex + 1) % userKeys.length]
    mainPage()
  }

  function mainPage() {
    currentQuestion.value = undefined
  }

  function selectQuestion(category: string, points: number) {
    if (!jdata.value) return
    const question = jdata.value.categories[category][points]
    question.used = !question.used
    if (!question.used) return
    questionRevealed.value = false
    answerState.value = AnswerState.Unanswered
    currentQuestion.value = { category, points }
  }

  function navigateTo(path: string) {
    if (route.path.endsWith("control")) return
    router.push(path)
  }

  function markUnsaved() {
    unsavedChanges.value = true
  }

  function saveToDB() {
    const data = jdata.value
    if (!data) return
    $fetch(`/api/jeopardy/update/${route.params.id}`, {
      method: 'POST',
      body: JSON.stringify(data)
    })
    unsavedChanges.value = false
  }




  watch(() => currentQuestion.value, (question) => {
    const baseUrl = '/jeopardy/play/' + route.params.id
    navigateTo(baseUrl + (question ? '/question' : '/main'))
  })


  return {
    jdata,
    status,
    error,
    users,
    currentUser,
    currentQuestion,
    questionRevealed,
    answerState,
    unsavedChanges,
    toggleJokerFromUser,
    addPointsToUser,
    nextPlayerAndMainPage,
    mainPage,
    selectQuestion,
    refreshData,
    markUnsaved,
    saveToDB
  }
})