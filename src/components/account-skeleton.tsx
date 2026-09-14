import type { Locale } from "@/lib/types";
import layout from "./account-panel.module.css";
import styles from "./account-skeleton.module.css";

function Bone({ className = "" }: { className?: string }) {
  return <div className={`${styles.bone} ${className}`} />;
}

export function AccountSkeleton({ signedIn, locale }: { signedIn: boolean; locale: Locale }) {
  return <div role="status" aria-live="polite">
    <span className={styles.srOnly}>{locale === "th" ? "กำลังโหลดบัญชีของคุณ…" : "Loading your account…"}</span>
    {signedIn ? <div className={layout.account} aria-hidden="true">
      <div className={layout.accountHeader}>
        <div className={styles.headingGroup}><Bone className={styles.title} /><Bone className={styles.subtitle} /></div>
        <Bone className={styles.link} />
      </div>
      <div className={layout.accountLayout}>
        <div>
          <div className={layout.identity}><Bone className={styles.sun} /><div className={styles.identityText}><Bone className={styles.label} /><Bone className={styles.line} /></div></div>
          <div className={styles.navigation}>{[0, 1, 2].map(item => <Bone className={styles.navItem} key={item} />)}</div>
          <div className={layout.sidebarActions}><Bone className={styles.link} /></div>
        </div>
        <div className={layout.accountMain}>
          <Bone className={styles.sectionTitle} />
          <div className={styles.order}><Bone className={styles.product} /><div className={styles.orderCopy}><Bone className={styles.sectionTitle} /><Bone className={styles.line} /><Bone className={styles.subtitle} /><Bone className={styles.link} /></div></div>
        </div>
      </div>
    </div> : <div className={layout.auth} aria-hidden="true">
      <div className={`${layout.story} ${styles.story}`}>
        <div className={layout.storyCopy}><Bone className={styles.sun} /><Bone className={styles.storyTitle} /><Bone className={styles.storyTitleShort} /><Bone className={styles.line} /></div>
        <Bone className={styles.photo} />
        <div className={layout.storyFoot}><Bone className={styles.link} /><Bone className={styles.link} /></div>
      </div>
      <div className={layout.authContent}>
        <Bone className={styles.back} />
        <div className={layout.authInner}>
          <div className={styles.modes}><Bone className={styles.link} /><Bone className={styles.link} /></div>
          <Bone className={styles.title} />
          <div className={styles.description}><Bone className={styles.line} /><Bone className={styles.subtitle} /></div>
          <div className={styles.fields}>{[0, 1].map(item => <div className={styles.field} key={item}><Bone className={styles.label} /><Bone className={styles.input} /></div>)}</div>
          <Bone className={styles.button} />
          <div className={layout.authFoot}><Bone className={styles.subtitle} /></div>
        </div>
      </div>
    </div>}
  </div>;
}
