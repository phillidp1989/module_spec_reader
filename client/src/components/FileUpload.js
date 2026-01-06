import React, { useState, useRef, useEffect } from "react";
import axios from "axios";
import DOMPurify from "dompurify";
import Message from "./Message";
import Progress from "./Progress";

// Searchable Select Component
const SearchableSelect = ({ options, value, onChange, placeholder, className }) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const containerRef = useRef(null);
  const inputRef = useRef(null);

  // Find current selection for display
  const selectedOption = options?.find(opt => opt.code === value);

  // Filter options based on search (match code or name)
  const filteredOptions = options?.filter(opt => {
    const searchLower = search.toLowerCase();
    return opt.name.toLowerCase().includes(searchLower) ||
           opt.code.toLowerCase().includes(searchLower);
  }) || [];

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (containerRef.current && !containerRef.current.contains(e.target)) {
        setIsOpen(false);
        setSearch('');
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleSelect = (code) => {
    onChange(code);
    setIsOpen(false);
    setSearch('');
  };

  const handleInputFocus = () => {
    setIsOpen(true);
  };

  const handleInputChange = (e) => {
    setSearch(e.target.value);
    if (!isOpen) setIsOpen(true);
  };

  const handleKeyDown = (e) => {
    if (e.key === 'Escape') {
      setIsOpen(false);
      setSearch('');
    } else if (e.key === 'Enter' && filteredOptions.length === 1) {
      handleSelect(filteredOptions[0].code);
    }
  };

  return (
    <div ref={containerRef} className={`relative ${className || ''}`}>
      <input
        ref={inputRef}
        type="text"
        value={isOpen ? search : (selectedOption ? `${selectedOption.name} (${selectedOption.code})` : '')}
        onChange={handleInputChange}
        onFocus={handleInputFocus}
        onKeyDown={handleKeyDown}
        placeholder={placeholder}
        className="w-full p-2 border border-gray-300 rounded bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
      />
      {isOpen && (
        <ul className="absolute z-50 w-full max-h-48 overflow-y-auto bg-white border border-gray-300 rounded-b shadow-lg mt-0.5">
          {filteredOptions.length === 0 ? (
            <li className="px-3 py-2 text-gray-500 text-sm">No matches found</li>
          ) : (
            filteredOptions.slice(0, 50).map(opt => (
              <li
                key={opt.code}
                onClick={() => handleSelect(opt.code)}
                className={`px-3 py-2 cursor-pointer text-sm hover:bg-blue-50 ${
                  opt.code === value ? 'bg-blue-100 font-medium' : ''
                }`}
              >
                {opt.name} <span className="text-gray-400">({opt.code})</span>
              </li>
            ))
          )}
          {filteredOptions.length > 50 && (
            <li className="px-3 py-2 text-gray-400 text-xs text-center">
              Type to narrow down {filteredOptions.length - 50} more options...
            </li>
          )}
        </ul>
      )}
    </div>
  );
};

// Field validation rules
const fieldValidation = {
  title: { maxLength: 100, required: true, label: 'Title' },
  shortTitle: { maxLength: 30, required: true, label: 'Short Title' },
  longTitle: { maxLength: 100, required: true, label: 'Long Title' },
  description: { maxLength: 4000, required: true, label: 'Description' },
  outcomes: { maxLength: 4000, required: true, label: 'Outcomes' },
  school: { required: true, label: 'School' },
  department: { required: true, label: 'Department' },
  credits: { required: true, label: 'Credits' },
  level: { required: true, label: 'Level' },
  semester: { required: true, label: 'Semester' },
  year: { required: true, label: 'Year' },
  subject: { required: true, label: 'Subject' },
  campus: { required: true, label: 'Campus' },
  campusCode: { required: true, label: 'Campus Code' },
  college: { required: true, label: 'College Code' },
  progLevel: { required: true, label: 'Prog Level' },
  scheduleType: { required: true, label: 'Schedule Type' },
  cc: { required: true, label: 'Cost Centre' },
  jacs: { required: true, label: 'JACS' },
  hecos: { required: true, label: 'HECoS' },
  assessment: { maxLength: 4000, required: true, label: 'Assessment' },
  lead: { required: true, label: 'Module Lead' },
};

const validateField = (fieldName, value) => {
  const rules = fieldValidation[fieldName];
  if (!rules) return { status: 'ok' };

  const strValue = String(value || '').trim();

  if (rules.required && strValue === '') {
    return { status: 'error', message: 'Missing' };
  }
  if (rules.maxLength && strValue.length > rules.maxLength) {
    return { status: 'warning', message: `${strValue.length}/${rules.maxLength}` };
  }
  return { status: 'ok' };
};

const getModuleValidationSummary = (module) => {
  let errors = 0, warnings = 0;
  Object.keys(fieldValidation).forEach(field => {
    const result = validateField(field, module[field]);
    if (result.status === 'error') errors++;
    if (result.status === 'warning') warnings++;
  });
  return { errors, warnings };
};

const FileUpload = () => {
  const url = process.env.REACT_APP_API_URL || 'http://localhost:5000';
  const fileInputRef = useRef(null);

  const [selectedFiles, setSelectedFiles] = useState([]);
  const [message, setMessage] = useState("");
  const [uploadPercentage, setUploadPercentage] = useState(0);
  const [filesUploaded, setFilesUploaded] = useState(false);
  const [moduleData, setModuleData] = useState([]);
  const [loading, setLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [sessionId, setSessionId] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  const [openAccordion, setOpenAccordion] = useState(null);
  const [downloadComplete, setDownloadComplete] = useState(false);
  const [moduleFilter, setModuleFilter] = useState('all'); // 'all', 'attention', 'ready'

  // Check if a module needs attention (has issues to fix)
  const moduleNeedsAttention = (module) => {
    return module.fuzzySuggestion ||
           module.hierarchyMismatch ||
           (module.missingDept && module.deptOptions?.length > 0) ||
           (module.missingSchool && module.schoolOptions?.length > 0);
  };

  // Get counts for filter badges
  const getModuleCounts = () => {
    const total = moduleData.length;
    const needsAttention = moduleData.filter(moduleNeedsAttention).length;
    const ready = total - needsAttention;
    return { total, needsAttention, ready };
  };

  // Get filtered modules based on current filter
  const getFilteredModules = () => {
    if (moduleFilter === 'attention') {
      return moduleData.map((m, i) => ({ module: m, originalIndex: i }))
                       .filter(({ module }) => moduleNeedsAttention(module));
    }
    if (moduleFilter === 'ready') {
      return moduleData.map((m, i) => ({ module: m, originalIndex: i }))
                       .filter(({ module }) => !moduleNeedsAttention(module));
    }
    return moduleData.map((m, i) => ({ module: m, originalIndex: i }));
  };

  // Find and scroll to next module that needs attention
  const handleFixNextIssue = () => {
    const nextIndex = moduleData.findIndex(moduleNeedsAttention);
    if (nextIndex >= 0) {
      setOpenAccordion(nextIndex);
      // Scroll to the module after a short delay to allow accordion to open
      setTimeout(() => {
        const element = document.getElementById(`module-${nextIndex}`);
        element?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }, 100);
    }
  };

  // Handle accepting a fuzzy department suggestion
  const handleAcceptSuggestion = (moduleIndex, suggestion) => {
    setModuleData(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        department: suggestion.suggested,
        deptCode: suggestion.suggestedCode,
        subject: suggestion.suggestedSubject,
        hecos: suggestion.suggestedHecos || updated[moduleIndex].hecos,
        jacs: suggestion.suggestedJacs || updated[moduleIndex].jacs,
        cc: suggestion.suggestedCc || updated[moduleIndex].cc,
        fuzzySuggestion: null, // Clear the suggestion after accepting
      };
      return updated;
    });
    setMessage(`Accepted: "${suggestion.original}" → "${suggestion.suggested}"`);
  };

  // Handle rejecting a fuzzy department suggestion
  const handleRejectSuggestion = (moduleIndex) => {
    setModuleData(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        fuzzySuggestion: null, // Clear the suggestion
      };
      return updated;
    });
  };

  // Handle fixing hierarchy mismatch (update college/school to match department)
  const handleFixHierarchy = (moduleIndex, expected) => {
    setModuleData(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        college: expected.collegeCode,
        schoolCode: expected.schoolCode,
        hierarchyMismatch: null, // Clear the mismatch flag
      };
      return updated;
    });
    setMessage(`Hierarchy corrected: School → ${expected.schoolCode}, College → ${expected.collegeCode}`);
  };

  // Handle selecting a department from the dropdown
  const handleSelectDept = (moduleIndex, deptCode) => {
    if (!deptCode) return;

    // Find the department info from the options (includes cascading data)
    const module = moduleData[moduleIndex];
    const deptInfo = module.deptOptions?.find(opt => opt.code === deptCode);

    setModuleData(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        deptCode: deptCode,
        department: deptInfo?.name || updated[moduleIndex].department,
        // Update cascading fields
        subject: deptInfo?.subject || updated[moduleIndex].subject,
        hecos: deptInfo?.hecos || updated[moduleIndex].hecos,
        jacs: deptInfo?.jacs || updated[moduleIndex].jacs,
        cc: deptInfo?.cc || updated[moduleIndex].cc,
        // Also update school/college if available from dept info
        schoolCode: updated[moduleIndex].schoolCode || deptInfo?.schoolCode,
        college: updated[moduleIndex].college || deptInfo?.collegeCode,
        missingDept: false,
        hierarchyMismatch: null, // Clear mismatch since user chose
      };
      return updated;
    });
    setMessage(`Department selected: ${deptInfo?.name} (${deptCode})`);
  };

  // Handle selecting a school from the dropdown
  const handleSelectSchool = (moduleIndex, schoolCode) => {
    if (!schoolCode) return;

    // Find the school info from the options (includes college info)
    const module = moduleData[moduleIndex];
    const schoolInfo = module.schoolOptions?.find(opt => opt.code === schoolCode);

    setModuleData(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        schoolCode: schoolCode,
        school: schoolInfo?.name || updated[moduleIndex].school,
        // Also update college if available from school info
        college: updated[moduleIndex].college || schoolInfo?.collegeCode,
        missingSchool: false,
        hierarchyMismatch: null, // Clear mismatch since user chose
      };
      return updated;
    });
    setMessage(`School selected: ${schoolInfo?.name} (${schoolCode})`);
  };

  // Handle selecting a college from the dropdown
  const handleSelectCollege = (moduleIndex, collegeCode) => {
    if (!collegeCode) return;

    const module = moduleData[moduleIndex];
    const collegeInfo = module.collegeOptions?.find(opt => opt.code === collegeCode);

    setModuleData(prev => {
      const updated = [...prev];
      updated[moduleIndex] = {
        ...updated[moduleIndex],
        college: collegeCode,
        hierarchyMismatch: null, // Clear mismatch since user chose
      };
      return updated;
    });
    setMessage(`College selected: ${collegeInfo?.name} (${collegeCode})`);
  };

  const sanitizeHTML = (html) => {
    if (!html) return '';
    return DOMPurify.sanitize(html, {
      ALLOWED_TAGS: ['br', 'strong', 'em', 'ul', 'ol', 'li', 'p', 'b', 'i'],
      ALLOWED_ATTR: []
    });
  };

  // Drag and drop handlers
  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const droppedFiles = Array.from(e.dataTransfer.files);
    const validFiles = validateAndFilterFiles(droppedFiles);
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
  };

  const validateAndFilterFiles = (files) => {
    const errors = [];
    const validFiles = [];

    files.forEach(file => {
      if (!file.name.toLowerCase().endsWith('.docx')) {
        errors.push(`${file.name}: Must be a .docx file`);
      } else if (file.size > 10 * 1024 * 1024) {
        errors.push(`${file.name}: File too large (max 10MB)`);
      } else {
        validFiles.push(file);
      }
    });

    if (errors.length > 0) {
      setMessage(errors.join('; '));
    }

    return validFiles;
  };

  const handleFileSelect = (e) => {
    const files = e.target.files ? Array.from(e.target.files) : [];
    const validFiles = validateAndFilterFiles(files);
    if (validFiles.length > 0) {
      setSelectedFiles(prev => [...prev, ...validFiles]);
    }
    e.target.value = '';
  };

  const removeFile = (index) => {
    setSelectedFiles(prev => prev.filter((_, i) => i !== index));
  };

  const onSubmit = async (e) => {
    e.preventDefault();
    if (selectedFiles.length === 0) {
      setMessage("No files selected");
      return;
    }

    const formData = new FormData();
    selectedFiles.forEach((file) => formData.append("file", file));

    try {
      setUploading(true);
      setMessage("");

      const res = await axios.post(`${url}/upload`, formData, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
        onUploadProgress: (progressEvent) => {
          setUploadPercentage(
            parseInt(
              Math.round((progressEvent.loaded * 100) / progressEvent.total)
            )
          );
        },
      });

      setTimeout(() => setUploadPercentage(0), 3000);

      setMessage(`${res.data.filesUploaded} file(s) uploaded successfully`);
      setSessionId(res.data.sessionId);
      setFilesUploaded(true);
      setSelectedFiles([]);
    } catch (err) {
      if (err.response?.status === 400) {
        setMessage(err.response.data.error || "Invalid file type");
      } else if (err.response?.status === 500) {
        setMessage("There was a problem with the server");
      } else {
        setMessage(err.response?.data?.error || "Upload failed");
      }
    } finally {
      setUploading(false);
    }
  };

  const clearFiles = async () => {
    if (!window.confirm('Are you sure you want to clear all uploaded files and data?')) {
      return;
    }

    try {
      const clearUrl = sessionId
        ? `${url}/api/clear?sessionId=${sessionId}`
        : `${url}/api/clear`;
      await axios.get(clearUrl);
      setMessage("Files Cleared");
      setSelectedFiles([]);
      setFilesUploaded(false);
      setModuleData([]);
      setSessionId(null);
      setOpenAccordion(null);
      setDownloadComplete(false);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to clear files");
    }
  };

  const generateData = async () => {
    try {
      setLoading(true);
      setMessage("");

      const dataUrl = sessionId
        ? `${url}/api/data?sessionId=${sessionId}`
        : `${url}/api/data`;
      const res = await axios.get(dataUrl);

      setModuleData(res.data);
      if (res.data.length === 0) {
        setMessage("No module specs found");
      } else {
        setMessage(`${res.data.length} module(s) processed successfully`);
      }
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to generate data");
    } finally {
      setLoading(false);
    }
  };

  const generateExcel = async () => {
    try {
      // POST current moduleData to generate Excel with user modifications
      const res = await axios.post(
        `${url}/api/download`,
        { moduleData, sessionId },
        { responseType: 'arraybuffer' }
      );
      const fileURL = window.URL.createObjectURL(new Blob([res.data]));
      const link = document.createElement("a");
      link.href = fileURL;
      link.setAttribute("download", "output.xlsx");
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(fileURL);
      setDownloadComplete(true);
    } catch (err) {
      setMessage(err.response?.data?.error || "Failed to download Excel file");
    }
  };

  const getRowClasses = (status) => {
    switch(status) {
      case 'error': return 'bg-red-50';
      case 'warning': return 'bg-yellow-50';
      default: return '';
    }
  };

  const renderField = (label, value, fieldName, moduleIssues = {}, moduleIndex = null) => {
    const validation = validateField(fieldName, value);
    const rowClass = getRowClasses(validation.status);

    // Check if this field has an issue that can be fixed
    const hasMismatch = moduleIssues.hierarchyMismatch &&
      ['school', 'schoolCode', 'college', 'department', 'deptCode'].includes(fieldName);
    const hasSuggestion = moduleIssues.fuzzySuggestion &&
      ['department', 'deptCode'].includes(fieldName);
    const hasMissingDeptFix = moduleIssues.missingDept && moduleIssues.deptOptions?.length > 0 &&
      ['department', 'deptCode', 'subject', 'cc', 'jacs', 'hecos'].includes(fieldName);
    const hasMissingSchoolFix = moduleIssues.missingSchool && moduleIssues.schoolOptions?.length > 0 &&
      ['school', 'schoolCode'].includes(fieldName);

    const scrollToFix = () => {
      if (moduleIndex !== null) {
        const moduleEl = document.getElementById(`module-${moduleIndex}`);
        moduleEl?.scrollIntoView({ behavior: 'smooth', block: 'start' });
      }
    };

    return (
      <tr key={fieldName} className={`border-b border-gray-200 ${rowClass}`}>
        <td className="px-4 py-2 font-medium text-gray-900 whitespace-nowrap w-1/3">
          {label}
          {validation.status !== 'ok' && (
            <span className={`ml-2 text-xs px-2 py-0.5 rounded ${
              validation.status === 'error'
                ? 'bg-red-500 text-white'
                : 'bg-yellow-400 text-gray-800'
            }`}>
              {validation.message}
            </span>
          )}
          {hasMismatch && (
            <button
              type="button"
              onClick={scrollToFix}
              className="ml-2 text-xs px-2 py-0.5 rounded bg-orange-500 text-white hover:bg-orange-600 cursor-pointer"
            >
              Mismatch
            </button>
          )}
          {hasSuggestion && (
            <button
              type="button"
              onClick={scrollToFix}
              className="ml-2 text-xs px-2 py-0.5 rounded bg-amber-500 text-white hover:bg-amber-600 cursor-pointer"
            >
              Suggestion
            </button>
          )}
          {(hasMissingDeptFix || hasMissingSchoolFix) && !hasMismatch && !hasSuggestion && (
            <button
              type="button"
              onClick={scrollToFix}
              className="ml-2 text-xs px-2 py-0.5 rounded bg-blue-500 text-white hover:bg-blue-600 cursor-pointer"
            >
              Select
            </button>
          )}
        </td>
        <td
          className="px-4 py-2 text-gray-700"
          dangerouslySetInnerHTML={{ __html: sanitizeHTML(value) || '-' }}
        />
      </tr>
    );
  };

  return (
    <div className="min-h-screen p-4 md:p-6">
      <div className="max-w-5xl mx-auto bg-white p-4 md:p-8 shadow-lg rounded-lg">
        <h1 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Module Specification Reader
        </h1>

        {message && <Message msg={message} />}

        <form onSubmit={onSubmit}>
          {/* Drag and Drop Zone */}
          <div
            className={`border-2 border-dashed rounded-lg p-8 md:p-10 text-center cursor-pointer transition-all ${
              isDragging
                ? 'border-blue-500 bg-blue-50'
                : 'border-gray-300 hover:border-blue-400 hover:bg-gray-50'
            }`}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            onDrop={handleDrop}
            onClick={() => fileInputRef.current?.click()}
          >
            <svg
              className="mx-auto h-12 w-12 text-gray-400 mb-3"
              fill="none"
              viewBox="0 0 24 24"
              stroke="currentColor"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
              />
            </svg>
            <p className="text-gray-600 mb-2">Drag and drop .docx files here</p>
            <p className="text-gray-400 text-sm">or click to browse</p>
            <input
              ref={fileInputRef}
              type="file"
              multiple
              accept=".docx"
              className="hidden"
              onChange={handleFileSelect}
            />
          </div>

          {/* Selected Files Preview */}
          {selectedFiles.length > 0 && (
            <div className="mt-4">
              <div className="flex justify-between items-center mb-2">
                <h6 className="text-sm font-medium text-gray-700">
                  Selected Files ({selectedFiles.length})
                </h6>
              </div>
              <ul className="divide-y divide-gray-200 border rounded-lg bg-gray-50">
                {selectedFiles.map((file, i) => (
                  <li key={i} className="flex justify-between items-center px-4 py-2">
                    <span className="text-gray-800 truncate flex-1">{file.name}</span>
                    <span className="text-gray-400 text-sm mx-4">
                      {(file.size / 1024).toFixed(1)} KB
                    </span>
                    <button
                      type="button"
                      className="text-red-500 hover:text-red-700 text-xl font-bold"
                      onClick={(e) => {
                        e.stopPropagation();
                        removeFile(i);
                      }}
                    >
                      &times;
                    </button>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Files uploaded - show compact drop zone for adding more */}
          {filesUploaded && (
            <div className="mt-4 flex items-center justify-between">
              <div
                className="flex-1 border border-dashed border-gray-300 rounded-lg p-3 text-center cursor-pointer hover:border-blue-400 hover:bg-gray-50 transition-all mr-3"
                onClick={() => fileInputRef.current?.click()}
              >
                <span className="text-gray-500 text-sm">+ Add more files</span>
              </div>
              <button
                type="button"
                onClick={clearFiles}
                disabled={uploading || loading}
                className="px-4 py-2 text-red-600 border border-red-300 rounded-lg hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed transition-colors text-sm"
              >
                Clear All
              </button>
            </div>
          )}

          {uploadPercentage > 0 && <Progress percentage={uploadPercentage} />}

          {/* Step Status Feedback */}
          {filesUploaded && moduleData.length === 0 && !loading && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-700 text-sm bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Files uploaded - ready to generate
              </span>
            </div>
          )}
          {moduleData.length > 0 && !downloadComplete && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-700 text-sm bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Data generated - ready to download
              </span>
            </div>
          )}
          {downloadComplete && (
            <div className="mt-4 text-center">
              <span className="inline-flex items-center gap-2 text-green-700 text-sm bg-green-50 px-3 py-1 rounded-full">
                <span className="w-2 h-2 bg-green-500 rounded-full"></span>
                Downloaded: output.xlsx
              </span>
            </div>
          )}

          {/* Step Indicator (informational only) */}
          <div className="flex items-center justify-center mt-6 mb-4">
            {/* Step 1 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                filesUploaded
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : 'bg-blue-600 text-white'
              }`}>
                {filesUploaded ? '✓' : '1'}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${filesUploaded ? 'text-green-700' : 'text-gray-700 font-medium'}`}>
                Upload
              </span>
            </div>

            <div className={`w-12 h-0.5 mx-2 ${filesUploaded ? 'bg-green-500' : 'bg-gray-300'}`}></div>

            {/* Step 2 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                moduleData.length > 0
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : filesUploaded
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {moduleData.length > 0 ? '✓' : '2'}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${
                moduleData.length > 0 ? 'text-green-700' : filesUploaded ? 'text-gray-700 font-medium' : 'text-gray-400'
              }`}>
                Generate
              </span>
            </div>

            <div className={`w-12 h-0.5 mx-2 ${moduleData.length > 0 ? 'bg-green-500' : 'bg-gray-300'}`}></div>

            {/* Step 3 */}
            <div className="flex items-center">
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-medium ${
                downloadComplete
                  ? 'bg-green-100 text-green-700 border-2 border-green-500'
                  : moduleData.length > 0
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-200 text-gray-500'
              }`}>
                {downloadComplete ? '✓' : '3'}
              </div>
              <span className={`ml-2 text-sm hidden sm:inline ${
                downloadComplete ? 'text-green-700' : moduleData.length > 0 ? 'text-gray-700 font-medium' : 'text-gray-400'
              }`}>
                Download
              </span>
            </div>
          </div>

          {/* Single Primary CTA */}
          <div className="flex justify-center">
            {!filesUploaded ? (
              <button
                type="submit"
                disabled={uploading || selectedFiles.length === 0}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg shadow-sm"
              >
                {uploading ? "Uploading..." : `Upload ${selectedFiles.length > 0 ? `${selectedFiles.length} File${selectedFiles.length > 1 ? 's' : ''}` : 'Files'}`}
              </button>
            ) : moduleData.length === 0 ? (
              <button
                type="button"
                onClick={generateData}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg shadow-sm"
              >
                {loading ? "Processing..." : "Generate Data"}
              </button>
            ) : (
              <button
                type="button"
                onClick={generateExcel}
                disabled={loading}
                className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-gray-400 disabled:cursor-not-allowed transition-colors font-medium text-lg shadow-sm"
              >
                {downloadComplete ? "Download Again" : "Download Excel"}
              </button>
            )}
          </div>
        </form>

        {/* Loading Spinner with Progress */}
        {(loading || uploading) && (
          <div className="text-center mt-6 p-4 bg-blue-50 rounded-lg border border-blue-200">
            <div className="inline-block w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin"></div>
            <p className="text-blue-800 font-medium mt-2">
              {uploading ? "Uploading files..." : "Processing documents..."}
            </p>
            {uploading && uploadPercentage > 0 && (
              <p className="text-blue-600 text-sm mt-1">
                {uploadPercentage}% complete
              </p>
            )}
            {loading && (
              <p className="text-blue-600 text-sm mt-1">
                Extracting data from module specifications...
              </p>
            )}
          </div>
        )}

        {/* Accordion - Module Data */}
        {moduleData.length > 0 && (
          <div className="mt-8">
            {/* Summary Bar */}
            {(() => {
              const counts = getModuleCounts();
              return (
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4 p-3 bg-gray-50 rounded-lg border">
                  <div className="flex items-center gap-4">
                    <span className="text-gray-700 font-medium">
                      {counts.total} module{counts.total !== 1 ? 's' : ''} processed
                    </span>
                    {counts.needsAttention > 0 && (
                      <span className="text-amber-600 text-sm">
                        {counts.needsAttention} need{counts.needsAttention === 1 ? 's' : ''} attention
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2">
                    {/* Filter tabs */}
                    <div className="flex rounded-lg border border-gray-300 overflow-hidden text-sm">
                      <button
                        type="button"
                        onClick={() => setModuleFilter('all')}
                        className={`px-3 py-1 ${moduleFilter === 'all' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        All
                      </button>
                      <button
                        type="button"
                        onClick={() => setModuleFilter('attention')}
                        className={`px-3 py-1 border-l border-gray-300 ${moduleFilter === 'attention' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        Needs Attention {counts.needsAttention > 0 && `(${counts.needsAttention})`}
                      </button>
                      <button
                        type="button"
                        onClick={() => setModuleFilter('ready')}
                        className={`px-3 py-1 border-l border-gray-300 ${moduleFilter === 'ready' ? 'bg-blue-600 text-white' : 'bg-white text-gray-600 hover:bg-gray-50'}`}
                      >
                        Ready
                      </button>
                    </div>
                    {/* Fix Next button */}
                    {counts.needsAttention > 0 && (
                      <button
                        type="button"
                        onClick={handleFixNextIssue}
                        className="px-3 py-1 bg-amber-500 text-white rounded-lg hover:bg-amber-600 text-sm font-medium"
                      >
                        Fix Next
                      </button>
                    )}
                  </div>
                </div>
              );
            })()}

            {/* Module List */}
            <div className="space-y-2">
            {getFilteredModules().map(({ module: file, originalIndex: i }) => {
              const summary = getModuleValidationSummary(file);
              const isOpen = openAccordion === i;
              const needsAttention = moduleNeedsAttention(file);

              return (
                <div key={i} id={`module-${i}`} className={`border rounded-lg overflow-hidden ${needsAttention ? 'border-amber-300' : ''}`}>
                  <button
                    type="button"
                    onClick={() => setOpenAccordion(isOpen ? null : i)}
                    className={`w-full px-4 py-3 text-left flex justify-between items-center transition-colors ${
                      needsAttention ? 'bg-amber-50 hover:bg-amber-100' : 'bg-gray-50 hover:bg-gray-100'
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0">
                      {needsAttention ? (
                        <span className="w-2 h-2 rounded-full bg-amber-500 flex-shrink-0"></span>
                      ) : (
                        <span className="w-2 h-2 rounded-full bg-green-500 flex-shrink-0"></span>
                      )}
                      <span className="font-medium text-gray-800 truncate">
                        {file.longTitle || file.title || 'Untitled Module'}
                      </span>
                    </div>
                    <span className="flex items-center gap-2 ml-2 flex-shrink-0">
                      {file.fuzzySuggestion && (
                        <span className="bg-amber-500 text-white text-xs px-2 py-1 rounded">
                          1 suggestion
                        </span>
                      )}
                      {file.hierarchyMismatch && (
                        <span className="bg-orange-500 text-white text-xs px-2 py-1 rounded">
                          Hierarchy mismatch
                        </span>
                      )}
                      {file.missingDept && file.deptOptions && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Select dept
                        </span>
                      )}
                      {file.missingSchool && file.schoolOptions && (
                        <span className="bg-blue-500 text-white text-xs px-2 py-1 rounded">
                          Select school
                        </span>
                      )}
                      {summary.errors > 0 && (
                        <span className="bg-red-500 text-white text-xs px-2 py-1 rounded">
                          {summary.errors} missing
                        </span>
                      )}
                      {summary.warnings > 0 && (
                        <span className="bg-yellow-400 text-gray-800 text-xs px-2 py-1 rounded">
                          {summary.warnings} long
                        </span>
                      )}
                      <span
                        className="text-gray-500 transition-transform duration-200"
                        style={{ transform: isOpen ? 'rotate(180deg)' : 'rotate(0deg)' }}
                      >
                        &#9660;
                      </span>
                    </span>
                  </button>

                  {isOpen && (
                    <div className="p-4 border-t bg-white">
                      {/* Fuzzy Suggestion Banner */}
                      {file.fuzzySuggestion && (
                        <div className="mb-4 p-4 bg-amber-50 border border-amber-300 rounded-lg">
                          <p className="text-amber-800 font-medium mb-2">
                            Department not found in mappings
                          </p>
                          <p className="text-gray-600 mb-3">
                            "<span className="font-medium">{file.fuzzySuggestion.original}</span>"
                            {' → '}Did you mean "<span className="font-medium text-amber-700">{file.fuzzySuggestion.suggested}</span>"?
                            <span className="text-gray-400 text-sm ml-2">
                              ({(file.fuzzySuggestion.score * 100).toFixed(0)}% match)
                            </span>
                          </p>
                          <div className="flex gap-2">
                            <button
                              type="button"
                              onClick={() => handleAcceptSuggestion(i, file.fuzzySuggestion)}
                              className="px-3 py-1 bg-green-600 text-white rounded hover:bg-green-700 text-sm"
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleRejectSuggestion(i)}
                              className="px-3 py-1 bg-gray-400 text-white rounded hover:bg-gray-500 text-sm"
                            >
                              Ignore
                            </button>
                          </div>
                        </div>
                      )}

                      {/* Hierarchy Mismatch Alert */}
                      {file.hierarchyMismatch && (
                        <div className="mb-4 p-4 bg-orange-50 border border-orange-300 rounded-lg">
                          <p className="text-orange-800 font-medium mb-2">
                            School/Department Mismatch
                          </p>
                          <p className="text-gray-700 text-sm mb-3">
                            Department <strong>{file.deptCode}</strong> belongs to School <strong>{file.hierarchyMismatch.expected?.schoolCode}</strong>,
                            but this module shows School <strong>{file.schoolCode || '(none)'}</strong>.
                          </p>

                          {/* Decision options */}
                          <div className="space-y-2">
                            <button
                              type="button"
                              onClick={() => handleFixHierarchy(i, file.hierarchyMismatch.expected)}
                              className="w-full sm:w-auto px-4 py-2 bg-orange-600 text-white rounded hover:bg-orange-700 text-sm font-medium flex items-center gap-2"
                            >
                              <span>Change School to {file.hierarchyMismatch.expected?.schoolCode}</span>
                              <span className="text-orange-200 text-xs">(Recommended)</span>
                            </button>

                            <p className="text-gray-500 text-xs pt-1">
                              Or keep School {file.schoolCode || '(current)'} and choose a different department:
                            </p>

                            <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                              {/* College dropdown */}
                              {file.collegeOptions && file.collegeOptions.length > 0 && (
                                <SearchableSelect
                                  options={file.collegeOptions}
                                  value={file.college || ''}
                                  onChange={(code) => handleSelectCollege(i, code)}
                                  placeholder="Search college..."
                                />
                              )}

                              {/* School dropdown */}
                              {file.schoolOptions && file.schoolOptions.length > 0 && (
                                <SearchableSelect
                                  options={file.schoolOptions}
                                  value={file.schoolCode || ''}
                                  onChange={(code) => handleSelectSchool(i, code)}
                                  placeholder="Search school..."
                                />
                              )}

                              {/* Department dropdown */}
                              {file.deptOptions && file.deptOptions.length > 0 && (
                                <SearchableSelect
                                  options={file.deptOptions}
                                  value={file.deptCode || ''}
                                  onChange={(code) => handleSelectDept(i, code)}
                                  placeholder="Search department..."
                                />
                              )}
                            </div>
                          </div>
                        </div>
                      )}

                      {/* Dropdown for Missing Department */}
                      {file.missingDept && file.deptOptions && file.deptOptions.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                          <p className="text-blue-800 font-medium mb-2">
                            Department not found - please select:
                          </p>
                          <SearchableSelect
                            options={file.deptOptions}
                            value={file.deptCode || ''}
                            onChange={(code) => handleSelectDept(i, code)}
                            placeholder="Type to search department..."
                          />
                          <p className="text-gray-400 text-xs mt-2">
                            {file.deptOptions.length} option{file.deptOptions.length !== 1 ? 's' : ''} available
                            {file.schoolCode && ` (filtered by school ${file.schoolCode})`}
                            {!file.schoolCode && file.college && ` (filtered by college ${file.college})`}
                          </p>
                        </div>
                      )}

                      {/* Dropdown for Missing School */}
                      {file.missingSchool && file.schoolOptions && file.schoolOptions.length > 0 && (
                        <div className="mb-4 p-4 bg-blue-50 border border-blue-300 rounded-lg">
                          <p className="text-blue-800 font-medium mb-2">
                            School not found - please select:
                          </p>
                          <SearchableSelect
                            options={file.schoolOptions}
                            value={file.schoolCode || ''}
                            onChange={(code) => handleSelectSchool(i, code)}
                            placeholder="Type to search school..."
                          />
                          <p className="text-gray-400 text-xs mt-2">
                            {file.schoolOptions.length} option{file.schoolOptions.length !== 1 ? 's' : ''} available
                            {file.deptCode && ` (based on department ${file.deptCode})`}
                            {!file.deptCode && file.college && ` (filtered by college ${file.college})`}
                          </p>
                        </div>
                      )}

                      <div className="overflow-x-auto">
                        <table className="min-w-full">
                          <tbody className="divide-y divide-gray-200">
                            {renderField('Title', file.title, 'title', file, i)}
                            {renderField('Short Title', file.shortTitle, 'shortTitle', file, i)}
                            {renderField('Year', file.year, 'year', file, i)}
                            {renderField('Subject', file.subject, 'subject', file, i)}
                            {renderField('School', file.school, 'school', file, i)}
                            {renderField('School Code', file.schoolCode, 'schoolCode', file, i)}
                            {renderField('Department', file.department, 'department', file, i)}
                            {renderField('Dept Code', file.deptCode, 'deptCode', file, i)}
                            {renderField('College Code', file.college, 'college', file, i)}
                            {renderField('Level', file.level, 'level', file, i)}
                            {renderField('Credits', file.credits, 'credits', file, i)}
                            {renderField('Prog Level', file.progLevel, 'progLevel', file, i)}
                            {renderField('Schedule Type', file.scheduleType, 'scheduleType', file, i)}
                            {renderField('Cost Centre', file.cc, 'cc', file, i)}
                            {renderField('JACS', file.jacs, 'jacs', file, i)}
                            {renderField('HECoS', file.hecos, 'hecos', file, i)}
                            {renderField('Pre-requisites', file.prereq, 'prereq', file, i)}
                            {renderField('Co-requisites', file.coreq, 'coreq', file, i)}
                            {renderField('Campus', file.campus, 'campus', file, i)}
                            {renderField('Campus Code', file.campusCode, 'campusCode', file, i)}
                            {renderField('Exemptions', file.exemptions, 'exemptions', file, i)}
                            {renderField('Lectures', file.lecture, 'lecture', file, i)}
                            {renderField('Seminars', file.seminar, 'seminar', file, i)}
                            {renderField('Tutorials', file.tutorial, 'tutorial', file, i)}
                            {renderField('Project Supervision', file.supervision, 'supervision', file, i)}
                            {renderField('Demonstrations', file.demonstration, 'demonstration', file, i)}
                            {renderField('Practical classes/workshops', file.practical, 'practical', file, i)}
                            {renderField('Supervised time in studio/workshop/lab', file.lab, 'lab', file, i)}
                            {renderField('Fieldwork', file.fieldwork, 'fieldwork', file, i)}
                            {renderField('External Visits', file.externalVisits, 'externalVisits', file, i)}
                            {renderField('Work based learning/placement', file.workBased, 'workBased', file, i)}
                            {renderField('Guided Independent Study', file.guided, 'guided', file, i)}
                            {renderField('Study Abroad', file.studyAbroad, 'studyAbroad', file, i)}
                            {renderField('Description', file.description, 'description', file, i)}
                            {renderField('Learning Outcomes', file.outcomes, 'outcomes', file, i)}
                            {renderField('Exam', file.exam, 'exam', file, i)}
                            {renderField('Exam Period', file.examPeriod, 'examPeriod', file, i)}
                            {renderField('Hurdles', file.hurdles, 'hurdles', file, i)}
                            {renderField('Assessment', file.assessment, 'assessment', file, i)}
                            {renderField('Semester', file.semester, 'semester', file, i)}
                            {renderField('Semester Code', file.semesterCode, 'semesterCode', file, i)}
                            {renderField('Module Lead', file.lead, 'lead', file, i)}
                          </tbody>
                        </table>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}
            </div>
          </div>
        )}

        {/* Minimal instructional hint - only shown when no action in progress */}
        {!loading && !uploading && !filesUploaded && selectedFiles.length === 0 && (
          <p className="mt-4 text-center text-gray-400 text-sm">
            Supported: .docx files up to 10MB
          </p>
        )}
      </div>
    </div>
  );
};

export default FileUpload;
