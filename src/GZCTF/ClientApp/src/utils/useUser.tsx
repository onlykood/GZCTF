import { useSWRConfig } from 'swr'
import { useNavigate } from 'react-router'
import { showNotification } from '@mantine/notifications'
import { mdiCheck, mdiClose } from '@mdi/js'
import { Icon } from '@mdi/react'
import api from '@Api'
import { useTranslation } from '@Utils/I18n'

export const useUser = () => {
  const navigate = useNavigate()
  const { t } = useTranslation()

  const {
    data: user,
    error,
    mutate,
  } = api.account.useAccountProfile({
    refreshInterval: 0,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
    onErrorRetry: (err, _key, _config, revalidate, { retryCount }) => {
      if (err?.status === 403) {
        api.account.accountLogOut().then(() => {
          navigate('/')
          showNotification({
            color: 'red',
            message: t('Account_Disabled'),
            icon: <Icon path={mdiClose} size={1} />,
          })
        })
        return
      }

      if (err?.status === 401) return

      if (retryCount >= 5) {
        mutate(undefined, false)
        return
      }

      setTimeout(() => revalidate({ retryCount: retryCount }), 10000)
    },
  })

  return { user, error, mutate }
}

export const useUserRole = () => {
  const { user, error } = useUser()
  return { role: user?.role, error }
}

export const useTeams = () => {
  const {
    data: teams,
    error,
    mutate,
  } = api.team.useTeamGetTeamsInfo({
    refreshInterval: 120000,
    shouldRetryOnError: false,
    revalidateOnFocus: false,
  })

  return { teams, error, mutate }
}

export const useLoginOut = () => {
  const navigate = useNavigate()
  const { mutate } = useSWRConfig()
  const { mutate: mutateProfile } = useUser()
  const { t } = useTranslation()

  return () => {
    api.account
      .accountLogOut()
      .then(() => {
        navigate('/')
        mutate((key) => typeof key === 'string' && key.includes('game/'), undefined, {
          revalidate: false,
        })
        mutateProfile(undefined, { revalidate: false })
        showNotification({
          color: 'teal',
          message: t('Account_SignedOut'),
          icon: <Icon path={mdiCheck} size={1} />,
        })
      })
      .catch(() => {
        navigate('/')
        mutateProfile(undefined, { revalidate: false })
      })
  }
}
