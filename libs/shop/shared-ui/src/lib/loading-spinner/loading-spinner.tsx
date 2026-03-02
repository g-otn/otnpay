import styles from './loading-spinner.module.css';

export function LoadingSpinner() {
  return (
    <div className={styles['spinner-container']}>
      <div aria-label="Loading..." className={styles['spinner']}>
        <div className={styles['bounce1']}></div>
        <div className={styles['bounce2']}></div>
        <div className={styles['bounce3']}></div>
      </div>
      <p className={styles['loading-text']}>Loading...</p>
    </div>
  );
}

export default LoadingSpinner;
