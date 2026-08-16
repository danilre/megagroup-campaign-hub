import * as React from 'react'
import {
  Body,
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

interface ReauthenticationEmailProps {
  token?: string
  siteName?: string
}

export const ReauthenticationEmail = ({
  token = '000000',
  siteName = BRAND.siteName,
}: ReauthenticationEmailProps) => (
  <Html lang="en" dir="ltr">
    <Head />
    <Preview>Ваш код подтверждения {siteName}</Preview>
    <Body style={styles.main}>
      <Container style={styles.container}>
        <Section style={styles.brandRow}>
          <Link href={BRAND.siteUrl} style={styles.brandMark}>
            <span style={styles.brandDot} />
            {siteName}
          </Link>
        </Section>

        <Heading style={styles.h1}>Подтвердите, что это вы</Heading>
        <Text style={styles.text}>
          Используйте код ниже, чтобы подтвердить свою личность в {siteName}.
        </Text>
        <Section style={styles.codeCard}>
          <Text style={styles.code}>{token}</Text>
        </Section>

        <Section style={styles.footer}>
          <Text style={{ margin: 0 }}>
            <span style={styles.footerStrong}>{siteName}</span> · {BRAND.tagline}
          </Text>
          <Text style={{ margin: '8px 0 0' }}>
            Срок действия кода скоро истечёт. Если вы не запрашивали его,
            просто проигнорируйте это письмо.
          </Text>
        </Section>
      </Container>
    </Body>
  </Html>
)

export default ReauthenticationEmail
