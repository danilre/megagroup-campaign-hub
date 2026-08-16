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

interface EmailChangeEmailProps {
  siteName?: string
  oldEmail?: string
  email?: string
  newEmail?: string
  confirmationUrl?: string
}

export const EmailChangeEmail = ({
  siteName = BRAND.siteName,
  oldEmail,
  newEmail,
  confirmationUrl = BRAND.siteUrl,
}: EmailChangeEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Подтвердите смену email для {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.brandRow}>
          <Link href={BRAND.siteUrl} style={styles.brandMark}>
            <span style={styles.brandDot} />
            {siteName}
          </Link>
        </Section>

        <Heading style={styles.h1}>Подтвердите смену email</Heading>
        <Text style={styles.text}>
          Вы запросили смену email-адреса вашего аккаунта {siteName}
          {oldEmail && newEmail ? (
            <>
              {' '}с{' '}
              <Link href={`mailto:${oldEmail}`} style={styles.link}>
                {oldEmail}
              </Link>{' '}
              на{' '}
              <Link href={`mailto:${newEmail}`} style={styles.link}>
                {newEmail}
              </Link>
            </>
          ) : null}
          .
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Подтвердить смену email
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
            Если вы не запрашивали это изменение, немедленно обезопасьте
            свой аккаунт, сбросив пароль.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default EmailChangeEmail
