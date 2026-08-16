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

interface RecoveryEmailProps {
  siteName?: string
  confirmationUrl?: string
}

export const RecoveryEmail = ({
  siteName = BRAND.siteName,
  confirmationUrl = BRAND.siteUrl,
}: RecoveryEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Сбросьте пароль для {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.brandRow}>
          <Link href={BRAND.siteUrl} style={styles.brandMark}>
            <span style={styles.brandDot} />
            {siteName}
          </Link>
        </Section>

        <Heading style={styles.h1}>Сброс пароля</Heading>
        <Text style={styles.text}>
          Мы получили запрос на сброс пароля для {siteName}. Задайте
          новый пароль по защищённой ссылке ниже.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Сбросить пароль
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
            Если вы не запрашивали сброс пароля, просто проигнорируйте это
            письмо — ваш пароль останется прежним.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default RecoveryEmail
