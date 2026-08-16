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

interface MagicLinkEmailProps {
  siteName?: string
  confirmationUrl?: string
}

export const MagicLinkEmail = ({
  siteName = BRAND.siteName,
  confirmationUrl = BRAND.siteUrl,
}: MagicLinkEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Ваша ссылка для входа в {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.brandRow}>
          <Link href={BRAND.siteUrl} style={styles.brandMark}>
            <span style={styles.brandDot} />
            {siteName}
          </Link>
        </Section>

        <Heading style={styles.h1}>Ваша ссылка для входа</Heading>
        <Text style={styles.text}>
          Нажмите кнопку ниже, чтобы войти в {siteName}. Эта ссылка скоро
          истечёт и может быть использована только один раз.
        </Text>
        <Button style={styles.button} href={confirmationUrl}>
          Войти
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
            Не запрашивали эту ссылку? Просто проигнорируйте это письмо.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default MagicLinkEmail
