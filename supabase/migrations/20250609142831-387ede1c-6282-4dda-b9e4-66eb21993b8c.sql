
-- Create table for storing datasets
CREATE TABLE IF NOT EXISTS public.datasets (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  data JSONB NOT NULL,
  size INTEGER NOT NULL,
  columns TEXT[] NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for storing model training results
CREATE TABLE IF NOT EXISTS public.model_trainings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_type TEXT NOT NULL,
  dataset_id UUID REFERENCES public.datasets(id),
  accuracy FLOAT NOT NULL,
  precision FLOAT NOT NULL,
  recall FLOAT NOT NULL,
  f1_score FLOAT NOT NULL,
  confusion_matrix JSONB NOT NULL,
  parameters JSONB NOT NULL,
  train_size INTEGER NOT NULL,
  test_size INTEGER NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create table for storing predictions
CREATE TABLE IF NOT EXISTS public.predictions (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  model_type TEXT NOT NULL,
  training_id UUID REFERENCES public.model_trainings(id),
  latitude FLOAT NOT NULL,
  longitude FLOAT NOT NULL,
  hour INTEGER NOT NULL,
  predicted_illegal BOOLEAN NOT NULL,
  probability FLOAT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Enable Row Level Security (optional - making tables public for now)
ALTER TABLE public.datasets ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.model_trainings ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.predictions ENABLE ROW LEVEL SECURITY;

-- Create policies to allow public access (you can restrict later if needed)
CREATE POLICY "Allow public access to datasets" ON public.datasets FOR ALL USING (true);
CREATE POLICY "Allow public access to model_trainings" ON public.model_trainings FOR ALL USING (true);
CREATE POLICY "Allow public access to predictions" ON public.predictions FOR ALL USING (true);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_predictions_location_hour ON public.predictions(latitude, longitude, hour);
CREATE INDEX IF NOT EXISTS idx_predictions_model_type ON public.predictions(model_type);
CREATE INDEX IF NOT EXISTS idx_model_trainings_model_type ON public.model_trainings(model_type);
