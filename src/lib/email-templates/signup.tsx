import * as React from 'react'
import {
  Body,
  Button,
  Container,
  Head,
  Heading,
  Html,
  Link,
  Preview,
  Section,
  Text,
} from '@react-email/components'
import { BRAND, styles } from './_brand'

interface SignupEmailProps {
  siteName?: string
  siteUrl?: string
  recipient?: string
  confirmationUrl?: string
}

export const SignupEmail = ({
  siteName = BRAND.siteName,
  siteUrl = BRAND.siteUrl,
  recipient,
  confirmationUrl = BRAND.siteUrl,
}: SignupEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Подтвердите email, чтобы начать пользоваться {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.brandRow}>
          <Link href={siteUrl} style={styles.brandMark}>
            <span style={styles.brandDot} />
            {siteName}
          </Link>
        </Section>

        <Heading style={styles.h1}>Подтвердите email</Heading>
        <Text style={styles.text}>
          Добро пожаловать в {siteName} — ваш маркетинговый центр управления. Подтвердите{' '}
          {recipient ? (
            <Link href={`mailto:${recipient}`} style={styles.link}>
              {recipient}
            </Link>
          ) : (
            'адрес электронной почты'
          )}{' '}
          чтобы активировать рабочее пространство.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Подтвердить email
        </Button>
        <Text style={styles.text}>
          Или вставьте эту ссылку в браузер:
          <br />
          <Link href={confirmationUrl} style={styles.link}>
            {confirmationUrl}
          </Link>
        </Text>

        <Section style={styles.footer}>
          <Text style={{ margin: 0 }}>
            <span style={styles.footerStrong}>{siteName}</span> · {BRAND.tagline}
          </Text>
          <Text style={{ margin: '8px 0 0' }}>
            Если вы не создавали аккаунт, просто проигнорируйте это письмо.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default SignupEmail
