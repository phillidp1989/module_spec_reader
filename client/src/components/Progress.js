import React from "react";
import PropTypes from "prop-types";

const Progress = ({ percentage }) => {
  return (
    <div className="w-full bg-gray-200 rounded-full h-4 mt-4">
      <div
        className="bg-green-500 h-4 rounded-full text-center text-xs text-white font-medium flex items-center justify-center transition-all duration-300"
        role="progressbar"
        style={{ width: `${percentage}%` }}
        aria-valuenow={percentage}
        aria-valuemin="0"
        aria-valuemax="100"
      >
        {percentage > 10 && `${percentage}%`}
      </div>
    </div>
  );
};

Progress.propTypes = {
  percentage: PropTypes.number.isRequired,
};

export default Progress;
