import {definePlugin} from '/@src/app'
import {useStorage} from '@vueuse/core'
import {createI18n} from 'vue-i18n'

/**
 * messages are generated using vite-plugin-i18n
 * each .json files located in the ./src/locales are registered in messages
 * @see https://github.com/intlify/bundle-tools/tree/main/packages/vite-plugin-vue-i18n
 */
import messages from '@intlify/vite-plugin-vue-i18n/messages'

const newMessages = Object.keys(messages).reduce((res, entry) => {
    const lang = entry.split('.')[1]
    if (lang) {
      const extendObject = entry.split('.')[0]
      return {
        ...res,
        [lang]: {
          ...res[lang],
          [extendObject]: messages[entry]
        }
      }
    }

    return {
      ...res,
      [entry]: {
        ...res[entry],
        ...messages[entry]
      }
    }

  }, {}
)

export default definePlugin(({app}) => {
  //const defaultLocale = useStorage('locale', navigator?.language || 'uk_UA')
  // set locale uk_UA manual
  const i18n = createI18n({
    locale: 'uk_UA',
    messages: {...newMessages}
  })

  app.use(i18n)
})
