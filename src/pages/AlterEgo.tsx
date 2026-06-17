import AlterEgoQuiz from '../components/alter-ego/AlterEgoQuiz'
import { useDocTitle } from '../hooks/useDocTitle'

export default function AlterEgo() {
  useDocTitle('CASTED — Cast Me')
  return <AlterEgoQuiz />
}
