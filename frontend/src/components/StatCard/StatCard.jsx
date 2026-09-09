import Icon from "../Icon/Icon";
function StatCard({ title, value, icon, detail, trend }) {
  return (
    <article className="stat-card">
      <div className="stat-card__top">
        <span className="stat-card__icon" aria-hidden="true">
          <Icon name={icon} size={21} />
        </span>

        {trend && (
          <span className="stat-card__trend">
            {trend}
          </span>
        )}
      </div>

      <p className="stat-card__title">{title}</p>

      <div className="stat-card__bottom">
        <strong className="stat-card__value">{value}</strong>

        {detail && (
          <span className="stat-card__detail">
            {detail}
          </span>
        )}
      </div>
    </article>
  );
}

export default StatCard;
