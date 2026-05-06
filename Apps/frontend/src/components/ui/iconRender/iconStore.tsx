import React from "react";
import { FaCalendarDay, FaRobot } from "react-icons/fa6";
import { IoCodeSharp, IoSchool } from "react-icons/io5";
import { MdMovieCreation } from "react-icons/md";



import css from "./iconStore.module.scss"





export const types: Record<string, () => React.ReactNode> = {
  development: () => (
    <div className={`${css.developmentIconWrapper} ${css.iconWrapper}`}>
<IoCodeSharp className={`${css.developmentIcon} ${css.icon}`} size={'20px'} />
</div>
),
daily: () => (
  <div className={`${css.dailyIconWrapper} ${css.iconWrapper}`}>
<FaCalendarDay className={`${css.dailyIcon} ${css.icon}`} size={'20px'} />
</div>
),
education: () => (
  <div className={`${css.educationIconWrapper} ${css.iconWrapper}`}>
<IoSchool className={`${css.educationIcon} ${css.icon}`} size={'20px'} />
</div>
),
entertainment: () => (
  <div className={`${css.entertainmentIconWrapper} ${css.iconWrapper}`}>
<MdMovieCreation className={`${css.entertainmentIcon} ${css.icon}`} size={'20px'} />
</div>
),
  other: () => (
    <div className={`${css.defaultIconWrapper} ${css.iconWrapper}`}>
      <FaRobot className={`${css.defaultIcon} ${css.icon}`} size={'20px'} />
    </div>
  ),

}
