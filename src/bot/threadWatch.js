import { CronJob } from 'cron'
import { getThreads } from '../module/scrape'
import _ from 'lodash'

const triggers = {
  ero: {
    room: 'watch_ero',
    name: 'エロ画像',
    exceeded: 10,
    regex: /エロ(画像|漫画|い)|エッチ/,
    getImage: true,
  },
  minecraft: {
    room: 'watch_minecraft',
    name: 'マイクラ',
    exceeded: 1,
    regex: /マインクラフト|マイクラ|minecraft/i,
    getImage: false,
  },
  splatoon: {
    room: 'watch_splatoon',
    name: 'スプラトゥーン',
    exceeded: 1,
    regex: /スプラ|splatoon/i,
    getImage: false,
  },
  programming: {
    room: 'watch_programmer',
    name: 'プログラミング',
    exceeded: 1,
    regex: /プログラ/,
    getImage: false,
  },
}

export default robot => {
  const threadWatch = async () => {
    const threads = await getThreads()
    const readedThreads = robot.brain.get('readedThreads') || {}

    const newPostedThreads = {}
    _.forEach(triggers, (trigger, triggerId) => {
      // th.count でフィルタ
      const drafts = []
      threads.forEach(th => {
        if (th.count < trigger.exceeded) {
          return
        }
        // 既ポストスレッドを trigger 毎に保存する
        const id = `${triggerId}-${th.id}`
        if (th.title.match(trigger.regex)) {
          newPostedThreads[id] = true
          const alreadyPosted = readedThreads[id]
          if (!alreadyPosted) {
            drafts.push(th)
          }
        }
      })
      if (drafts.length > 0) {
        const textHeader = `${trigger.name} のスレを見つけたぞ！\n`
        const text = [
          textHeader,
          ...drafts.map(th => `${th.title}→${th.url}`),
        ].join('\n')
        robot.send({ room: trigger.room }, text)
      }
    })
    robot.brain.set('readedThreads', newPostedThreads)
  }
  const cron = new CronJob('00 * * * * *', threadWatch)
  cron.start()
}
