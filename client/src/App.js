import './App.css';
import FileUpload from './components/FileUpload';

function App() {
  return (
    <div className="container mt-5" style={{width: "100%"}}>         
      <h4 className="display-4 text-center mb-4 fw-bold">Module Spec Upload</h4>
    <div className='col-sm-12 col-md-10 d-flex justify-content-center m-auto'>
    <div className="card p-5 shadow rounded" style={{width: "100%"}}>
      <FileUpload />      
      </div>
    </div>
    </div>
  );
}

export default App;
