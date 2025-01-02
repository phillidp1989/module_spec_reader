import React, { useState } from "react";
import axios from "axios";
import Message from "./Message";
import Progress from "./Progress";

const FileUpload = () => {
  let env = 'prod';
  let url = '';
  if (env === 'dev') {
    url = 'http://localhost:5000';
  } 
  const [files, setFiles] = useState([]);  
  const [uploadedFiles, setUploadedFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [filesCleared, setFilesCleared] = useState(false);
  const [moduleData, setModuleData] = useState([]);
  const [loading, setLoading] = useState(false);

  const onChange = (e) => {
    setFiles(e.target.files ? Array.from(e.target.files) : []);
  };

  const onSubmit = async (e) => {    
    e.preventDefault();
    if (files.length === 0) {
      setMessage("No files selected");      
    } else {      
      const formData = new FormData();
      files.forEach((file) => formData.append("file", file));
      try {
      const res = await axios.post(`${url}/upload`,formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          setUploadPercentage(
            parseInt(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
              )
          );
          // Clear percentage
          setTimeout(() => setUploadPercentage(0), 3000);
        },
      });

      setMessage("Files Uploaded");  
      const { fileNames, filePath } = res.data;      
      setUploadedFiles([{ fileNames, filePath }]);
      setFilesUploaded(true);
    
    } catch (err) {
      if (err.response.status === 500) {
        setMessage("There was a problem with the server");
      } else {
        setMessage(err.response.data);
      }
    }

    }
  };

  const clearFiles = async () => {
    try {
      const res = await axios.get(`${url}/api/clear`);
      console.log(res.data);
      setMessage("Files Cleared");
      setFiles([]);
      setFilesCleared(true);
      setModuleData([]);
    } catch (err) {
      console.log(err);
    }
  };

  const generateData = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`${url}/api/data`);
      setLoading(false);
      setModuleData(res.data);
      if (res.data.length === 0) {
        setMessage("No module specs found");
      }
      console.log(res.data);
    } catch (err) {
      console.log(err);
    }
  };

  // const generateExcel = async () => {
  //   try {
  //     const res = await axios.get('/download',{ responseType: 'arraybuffer' });
  //      // download excel file from server
  //     const url = window.URL.createObjectURL(new Blob([res.data]));
  //     const link = document.createElement("a");
  //     link.href = url;
  //     link.setAttribute("download", "output.xlsx");
  //     document.body.appendChild(link);
  //     link.click();     
  //   } catch (err) {
  //     console.log(err);
  //   }
  // };

  const generateExcel = async () => {
    try {
      const res = await axios.get(`${url}/download`, { responseType: 'arraybuffer' });
      const fileURL = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "output.xlsx");
      document.body.appendChild(link);
      link.click();
    } catch (err) {
      console.log(err);
    }
  };
  

  return (
    <>
      {message ? <Message msg={message} /> : null}
      <form onSubmit={onSubmit}>
        <div className="custom-file mb-4 text-center">
          <input
            type="file"
            className="form-control"
            aria-describedby="inputGroupFileAddon04"
            aria-label="Upload"
            id="formFileMultiple"
            multiple
            onChange={onChange}
          />
          {uploadPercentage > 0 ? (
            <Progress percentage={uploadPercentage} />
          ) : null}
          <input
            type="submit"
            value="Upload Word Files"
            className="btn btn-primary btn-block mt-4 ms-2"
          />          
          {/* {filesUploaded && ( */}
          <button
            type="button"
            className="btn btn-info mt-4 ms-2"
            onClick={generateData}
          >
            Generate Module Data
          </button>
          {/* )} */}
          {moduleData.length > 0 && (
            <button
              type="button"
              className="btn btn-success mt-4 ms-2"
              onClick={generateExcel}
            >
              Download Excel File
            </button>
          )}
          <button
            type="button"
            className="btn btn-danger mt-4 ms-2"
            onClick={clearFiles}
          >
            Clear Files
          </button>
        </div>
      </form>
      {loading && (
        <div className="text-center">
            <div class="spinner-border text-info mb-4 text-center w-90" role="status">
              <span class="sr-only">Loading...</span>
            </div>
            </div>
          )}
      <div className="accordion mb-5" id="accordionExample">
        {moduleData.length > 0
          ? moduleData.map((file, i) => (
              <div key={i} className="accordion-item">
                <h2 className="accordion-header" id={`heading${i}`}>
                  <button
                    className="accordion-button collapsed"
                    type="button"
                    data-bs-toggle="collapse"
                    data-bs-target={`#collapse${i}`}
                    aria-expanded="true"
                    aria-controls={`collapse${i}`}
                  >
                    {file.longTitle}
                  </button>
                </h2>
                <div
                  id={`collapse${i}`}
                  className="accordion-collapse collapse"
                  aria-labelledby="headingOne"
                  data-bs-parent="#accordionExample"
                >
                  <div className="accordion-body">
                    <table className="table table-bordered">
                      <tdbody>
                        <tr className="table-light">
                          <td>
                            <strong>Title</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.title }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Short Title</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.shortTitle,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Year</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.year }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Subject</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.subject }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>School</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.school }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>School Code</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.schoolCode,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Department</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.department,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Dept Code</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.deptCode }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>College Code</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.college }}
                          ></td>
                        </tr>

                        <tr className="table-light">
                          <td>
                            <strong>Level</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.level }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Credits</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.credits }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Prog Level</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.progLevel }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Schedule Type</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.scheduleType,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Cost Centre</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.cc }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>JACS</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.jacs }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>HECoS</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.hecos }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Pre-requisites</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.prereq }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Co-requisites</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.coreq }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Campus</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.campus }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Campus Code</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.campusCode,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Exemptions</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.exemptions,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Lectures</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.lecture }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Seminars</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.seminar }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Tutorials</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.tutorial }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Project Supervision</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.supervision,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Demonstrations</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.demonstration,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Practical classes/workshops</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.practical }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>
                              Supervised time in a studio/workshop/lab
                            </strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.lab }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Fieldwork</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.fieldwork }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>External Visits</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.externalVisits,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Work based learning/placement</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.workBased }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Guided Independent Study</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.guided }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Study Abroad</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.studyAbroad,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Description</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.description,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Learning Outcomes</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.outcomes }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Exam</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.exam }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Exam Period</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.examPeriod,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Hurdles</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.hurdles }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Assessment</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.assessment,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Semester</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.semester }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Semester Code</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{
                              __html: file.semesterCode,
                            }}
                          ></td>
                        </tr>
                        <tr className="table-light">
                          <td>
                            <strong>Module Lead</strong>
                          </td>
                          <td
                            dangerouslySetInnerHTML={{ __html: file.lead }}
                          ></td>
                        </tr>
                      </tdbody>
                    </table>
                  </div>
                </div>
              </div>
            ))
          : null}
      </div>
    </>
  );
};

export default FileUpload;
